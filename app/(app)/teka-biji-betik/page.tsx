import { createClient } from "@/lib/supabase/server";
import type { BetikGame, BetikGuess, Participant } from "@/lib/types";
import { BetikGameManager } from "./betik-game-manager";

export const metadata = { title: "Teka Biji Betik" };

export default async function TekaBijiBetikPage() {
  const supabase = await createClient();
  const [{ data: game, error: gameError }, { data: guesses, error: guessesError }, { data: participants, error: participantsError }] = await Promise.all([
    supabase.from("betik_game").select("*").eq("id", 1).single(),
    supabase.from("betik_guesses").select("id,participant_id,guessed_count,created_by,created_at,updated_at,participant:participants!betik_guesses_participant_id_fkey(id,towel_number,name,status)").order("created_at", { ascending: false }),
    supabase.from("participants").select("id,towel_number,name,status").in("status", ["eligible", "won"]).order("towel_number"),
  ]);
  if (gameError) throw gameError;
  if (guessesError) throw guessesError;
  if (participantsError) throw participantsError;

  return (
    <div className="page betik-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Permainan sampingan kenduri</span>
          <h1>Teka Biji Betik</h1>
          <p>Rekod satu tekaan bagi setiap peserta berdaftar dan cari pemenang paling hampir secara automatik.</p>
        </div>
      </header>
      <BetikGameManager game={game as BetikGame} guesses={(guesses ?? []) as unknown as BetikGuess[]} participants={(participants ?? []) as Pick<Participant, "id" | "towel_number" | "name" | "status">[]} />
    </div>
  );
}
