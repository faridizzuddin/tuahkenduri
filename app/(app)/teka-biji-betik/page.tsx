import { createClient } from "@/lib/supabase/server";
import type { BetikGame, BetikGuess } from "@/lib/types";
import { BetikGameManager } from "./betik-game-manager";

export const metadata = { title: "Teka Biji Betik" };

export default async function TekaBijiBetikPage() {
  const supabase = await createClient();
  const [{ data: game, error: gameError }, { data: guesses, error: guessesError }] = await Promise.all([
    supabase.from("betik_game").select("*").eq("id", 1).single(),
    supabase.from("betik_guesses").select("*").order("created_at", { ascending: false }),
  ]);
  if (gameError) throw gameError;
  if (guessesError) throw guessesError;

  return (
    <div className="page betik-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Permainan sampingan kenduri</span>
          <h1>Teka Biji Betik</h1>
          <p>Rekod tekaan tetamu, masukkan jumlah sebenar, dan cari pemenang paling hampir secara automatik.</p>
        </div>
      </header>
      <BetikGameManager game={game as BetikGame} guesses={(guesses ?? []) as BetikGuess[]} />
    </div>
  );
}
