export type ParticipantStatus = "eligible" | "won" | "absent" | "disabled";
export type GiftStatus = "available" | "claimed" | "disabled";
export type DrawStatus = "participant_selected" | "winner_confirmed" | "completed" | "cancelled";

export interface Participant {
  id: string;
  towel_number: string;
  name: string;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
}

export interface Gift {
  id: string;
  gift_number: string;
  status: GiftStatus;
  created_at: string;
  updated_at: string;
}

export interface DrawView {
  id: string;
  sequence_number: number;
  status: DrawStatus;
  participant_drawn_at: string;
  completed_at: string | null;
  participant: Pick<Participant, "id" | "towel_number" | "name">;
  gift: Pick<Gift, "id" | "gift_number"> | null;
}

export interface BetikGame {
  id: number;
  actual_seed_count: number | null;
  revealed_at: string | null;
  updated_at: string;
}

export interface BetikGuess {
  id: string;
  participant_name: string;
  entry_reference: string | null;
  guessed_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RankedBetikGuess extends BetikGuess {
  difference: number;
  rank: number;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}
