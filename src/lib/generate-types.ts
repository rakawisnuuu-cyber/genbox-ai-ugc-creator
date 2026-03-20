export type GenState = "idle" | "loading" | "completed" | "failed";

export interface ShotStatus {
  state: "pending" | "prompt_ready" | "prompting" | "generating" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  prompt?: string;
}
