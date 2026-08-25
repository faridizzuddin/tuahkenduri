import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase/migrations/202607120001_initial_schema.sql"), "utf8").toLowerCase();
const safeResetSql = readFileSync(join(process.cwd(), "supabase/migrations/202607120002_safe_reset_functions.sql"), "utf8").toLowerCase();
const betikSql = readFileSync(join(process.cwd(), "supabase/migrations/202608250001_teka_biji_betik.sql"), "utf8").toLowerCase();

describe("draw database safety contract", () => {
  it("uses cryptographic server randomness and row locks", () => {
    expect(sql).toContain("order by extensions.gen_random_bytes(16)");
    expect(sql).toContain("for update of p skip locked");
    expect(sql).toContain("for update of g skip locked");
  });

  it("prevents reusing committed participants and gifts", () => {
    expect(sql).toContain("draw_results_one_committed_participant");
    expect(sql).toContain("draw_results_one_active_per_host");
    expect(sql).toMatch(/gift_id uuid unique/);
  });

  it("keeps draw mutations behind authenticated RPC functions", () => {
    expect(sql).toContain("revoke all on public.draw_results from anon, authenticated");
    expect(sql).toContain("security definer");
    expect(sql).toContain("public.require_authenticated()");
  });

  it("keeps destructive maintenance functions compatible with pg-safeupdate", () => {
    expect(safeResetSql).toContain("delete from public.draw_results where id is not null");
    expect(safeResetSql).toContain("delete from public.participants where id is not null");
    expect(safeResetSql).toContain("delete from public.gifts where id is not null");
    expect(safeResetSql).not.toMatch(/delete from public\.(draw_results|participants|gifts)\s*;/);
  });
});

describe("teka biji betik database safety contract", () => {
  it("keeps the answer behind authenticated RPC functions", () => {
    expect(betikSql).toContain("security definer");
    expect(betikSql).toContain("public.require_authenticated()");
    expect(betikSql).toContain("revoke all on public.betik_game from anon, authenticated");
    expect(betikSql).toContain("grant execute on function public.reveal_betik_answer(integer) to authenticated");
  });

  it("locks guess mutations after the answer is revealed", () => {
    expect(betikSql).toContain("betik_guesses_only_while_open");
    expect(betikSql).toContain("before insert or update or delete on public.betik_guesses");
    expect(betikSql).toContain("if answer is not null then");
    expect(betikSql).toContain("for key share");
    expect(betikSql).toContain("for update");
  });

  it("enables row-level security for both game tables", () => {
    expect(betikSql).toContain("alter table public.betik_game enable row level security");
    expect(betikSql).toContain("alter table public.betik_guesses enable row level security");
  });
});
