import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase/migrations/202607120001_initial_schema.sql"), "utf8").toLowerCase();

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
});
