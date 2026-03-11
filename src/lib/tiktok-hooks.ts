/**
 * TikTok Hook Library — Indonesian casual/gaul hooks organized by category.
 * Used by Quick Video dialog script builder.
 */

import type { ContentTemplateKey } from "./content-templates";

export type HookCategory =
  | "curiosity"
  | "relatable_problem"
  | "honest_review"
  | "surprise"
  | "pov"
  | "mini_story"
  | "pattern_interrupt"
  | "recommendation";

export const HOOK_CATEGORY_LABELS: Record<HookCategory, string> = {
  curiosity: "Rasa Penasaran",
  relatable_problem: "Masalah Relatable",
  honest_review: "Review Jujur",
  surprise: "Kejutan",
  pov: "POV",
  mini_story: "Mini Story",
  pattern_interrupt: "Stop Scroll",
  recommendation: "Rekomendasi",
};

export const HOOKS: Record<HookCategory, string[]> = {
  curiosity: [
    "Kenapa ga ada yang ngomongin produk ini dari dulu sih?",
    "Aku baru tau ini ternyata sebagus ini...",
    "Serius nanya, kenapa ini ga viral dari dulu?",
    "Aku kira ini bakal biasa aja… ternyata engga.",
    "Ini salah satu produk paling underrated yang pernah aku coba.",
    "Kok baru sekarang aku nemu ini ya?",
    "Awalnya aku ga expect apa-apa… tapi hasilnya malah bikin kaget.",
    "Aku kira ini cuma hype doang… ternyata salah.",
    "Ini salah satu discovery terbaik aku tahun ini.",
    "Aku literally baru nemu ini dan langsung pengen share.",
  ],
  relatable_problem: [
    "Kalau kamu punya masalah yang sama kayak aku, ini mungkin bakal ngebantu.",
    "Aku udah coba banyak cara buat solve ini… tapi baru ini yang works.",
    "Siapa di sini yang juga struggle sama ini?",
    "Aku capek banget coba produk yang hasilnya biasa aja.",
    "Ini problem kecil tapi ganggu banget tiap hari.",
    "Setiap hari aku selalu ngalamin ini… sampai akhirnya nemu ini.",
    "Aku sempet hampir nyerah cari solusinya.",
    "Kalau kamu relate sama ini, dengerin dulu.",
  ],
  honest_review: [
    "Oke aku bakal review ini sejujur mungkin.",
    "Aku udah pake ini beberapa hari, ini pendapat jujur aku.",
    "Jujur ya… aku ga dibayar buat ngomong ini.",
    "Ini honest review setelah aku pake sendiri.",
    "Aku bakal kasih tau plus minusnya langsung.",
    "Jujur aja aku ga expect bakal sebagus ini.",
    "Ini review tanpa filter.",
    "Banyak yang nanya soal ini, jadi aku akhirnya coba.",
    "Oke kita bahas plus minusnya langsung aja ya.",
    "Ini bukan review yang dilebih-lebihin ya, ini pengalaman aku beneran.",
  ],
  surprise: [
    "Wait… hasilnya kok bisa gini?",
    "Aku beneran kaget pas liat hasilnya.",
    "Ini literally di luar ekspektasi aku.",
    "Aku ga nyangka bakal sebeda ini.",
    "Serius, aku ga expect bakal secepet ini.",
    "Aku sampe double check karena ga percaya.",
    "Aku kira ini bakal biasa aja… tapi ternyata engga sama sekali.",
    "Aku beneran speechless pas liat hasilnya.",
  ],
  pov: [
    "POV: kamu akhirnya nemu produk yang beneran works.",
    "POV: kamu udah coba banyak brand tapi ga ada yang cocok.",
    "POV: ini jadi produk favorit baru kamu.",
    "POV: kamu nyoba ini sekali dan langsung ketagihan.",
    "POV: kamu nyaranin ini ke semua temen kamu.",
    "POV: kamu akhirnya ngerti kenapa ini viral.",
    "POV: satu produk yang bikin kamu stop cari yang lain.",
    "POV: kamu ga nyangka hasilnya bakal secepat ini.",
  ],
  mini_story: [
    "Jadi ceritanya aku nemu ini secara ga sengaja.",
    "Aku awalnya beli ini cuma karena penasaran.",
    "Awalnya temen aku yang rekomendasiin ini.",
    "Aku liat ini lewat FYP dan akhirnya coba.",
    "Jadi aku udah pake ini sekitar seminggu.",
    "Aku nemu ini waktu lagi random scroll.",
    "Ini awalnya cuma impulse buy.",
    "Aku ga sengaja nemu ini waktu lagi cari produk lain.",
  ],
  pattern_interrupt: [
    "Tunggu bentar… kamu harus liat ini.",
    "Stop scroll dulu sebentar.",
    "Ini cuma butuh 10 detik buat jelasin.",
    "Kamu mungkin ga tau ini.",
    "Ini yang ga banyak orang tau.",
    "Aku harus tunjukin ini ke kalian.",
    "Ini kecil tapi impact-nya gede.",
    "Coba liat ini sebentar.",
  ],
  recommendation: [
    "Aku jarang banget rekomendasiin produk, tapi ini beda.",
    "Ini salah satu produk yang beneran aku recommend.",
    "Aku bakal repurchase ini sih.",
    "Ini langsung masuk list favorit aku.",
    "Menurut aku ini worth dicoba.",
    "Ini produk yang bakal aku pake lagi.",
    "Ini salah satu purchase terbaik aku.",
  ],
};

/** Map each content template to its most relevant hook categories */
const TEMPLATE_HOOK_MAP: Record<ContentTemplateKey, HookCategory[]> = {
  problem_solution: ["relatable_problem", "curiosity", "surprise"],
  review_jujur: ["honest_review", "curiosity", "recommendation"],
  unboxing: ["surprise", "curiosity", "mini_story"],
  before_after: ["surprise", "relatable_problem", "pattern_interrupt"],
  daily_routine: ["mini_story", "recommendation", "curiosity"],
  quick_haul: ["pattern_interrupt", "surprise", "recommendation"],
  asmr_aesthetic: ["curiosity", "pattern_interrupt"],
  pov_style: ["pov", "curiosity", "mini_story"],
  grwm: ["mini_story", "relatable_problem", "recommendation"],
  tiga_alasan: ["honest_review", "recommendation", "curiosity"],
  expectation_reality: ["surprise", "pattern_interrupt", "honest_review"],
  tutorial_singkat: ["curiosity", "recommendation", "mini_story"],
  day_in_my_life: ["mini_story", "relatable_problem", "recommendation"],
  first_impression: ["honest_review", "surprise", "curiosity"],
};

/** Get the relevant hook categories for a template */
export function getHookCategoriesForTemplate(templateKey: ContentTemplateKey): HookCategory[] {
  return TEMPLATE_HOOK_MAP[templateKey] || ["curiosity"];
}

/** Get all hooks from relevant categories for a template */
export function getHooksForTemplate(templateKey: ContentTemplateKey): { category: HookCategory; hooks: string[] }[] {
  const categories = TEMPLATE_HOOK_MAP[templateKey] || ["curiosity"];
  return categories.map((cat) => ({ category: cat, hooks: HOOKS[cat] }));
}

/** Pick N random hooks from relevant categories */
export function getRandomHooks(templateKey: ContentTemplateKey, count: number = 5): string[] {
  const categories = TEMPLATE_HOOK_MAP[templateKey] || ["curiosity"];
  const allHooks = categories.flatMap((cat) => HOOKS[cat]);
  const shuffled = [...allHooks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Pick a single random hook */
export function getRandomHook(templateKey: ContentTemplateKey): string {
  return getRandomHooks(templateKey, 1)[0] || "";
}

/** Template-specific body scripts */
export const BODY_SCRIPTS: Record<ContentTemplateKey, string[]> = {
  problem_solution: [
    "Serius deh, aku udah coba macem-macem tapi ga ada yang works… sampai akhirnya nemu ini.",
    "Kalau kamu punya masalah yang sama kayak aku, ini fix wajib coba sih.",
    "Kenapa baru sekarang aku nemu ini ya… padahal solusinya sesimpel ini.",
    "Aku kira bakal biasa aja, ternyata beneran ngebantu banget.",
    "Ini salah satu produk yang bikin aku mikir: kok ga dari dulu ya pake ini?",
    "Awalnya cuma coba-coba… tapi sekarang malah jadi andalan.",
  ],
  review_jujur: [
    "Jujur ya, aku ga expect bakal sebagus ini.",
    "Aku udah pake beberapa hari dan ini pendapat jujur aku.",
    "Buat yang lagi mikir mau beli atau engga, semoga review ini bantu ya.",
    "Aku bakal jujur banget di video ini, jadi stay sampai akhir.",
    "Ini bukan review yang dilebih-lebihin ya, ini pengalaman aku beneran.",
    "Oke kita bahas plus minusnya langsung aja ya.",
  ],
  unboxing: [
    "Akhirnya sampe juga paket yang aku tunggu-tunggu!",
    "Kita liat dulu dalemnya dapet apa aja...",
    "Jujur aku penasaran banget sama produk ini.",
    "Oke ini unboxing pertama aku buat produk ini.",
    "Wah packaging-nya niat juga ya ternyata.",
    "Kita buka pelan-pelan ya biar ga rusak box-nya.",
  ],
  before_after: [
    "Oke ini kondisi awalnya dulu ya...",
    "Ini before aku beberapa hari yang lalu.",
    "Dan ini hasilnya setelah rutin pake.",
    "Aku juga kaget sih pas liat hasilnya.",
    "Perubahannya lumayan keliatan kan?",
    "Ini bukti kalau konsisten pake tuh emang ngaruh.",
  ],
  daily_routine: [
    "Ini salah satu step yang selalu aku lakuin tiap hari.",
    "Udah masuk routine aku dan jujur susah skip ini.",
    "Aku pake ini hampir tiap hari sih.",
    "Simple banget tapi ngaruh ke hasilnya.",
    "Ini step kecil tapi penting banget di routine aku.",
    "Udah jadi bagian dari keseharian aku sekarang.",
  ],
  quick_haul: [
    "Barusan banget dapet ini dan langsung pengen share.",
    "Cuma beli satu tapi menurut aku worth banget.",
    "Ini salah satu random purchase terbaik aku.",
    "Aku ga nyangka bakal suka ini sih.",
    "Ini tipikal produk yang langsung kepake.",
    "Singkat aja: aku recommend.",
  ],
  asmr_aesthetic: [
    "Dengerin deh suaranya...",
    "Liat teksturnya deh...",
    "Ini satisfying banget sih.",
    "Coba liat pas di-apply...",
    "Teksturnya lembut banget.",
    "Ini beneran calming sih.",
  ],
  pov_style: [
    "POV: kamu akhirnya nemu produk yang beneran works.",
    "POV: kamu nyoba ini dan langsung ketagihan.",
    "POV: satu produk yang bikin kamu stop cari yang lain.",
    "POV: kamu nyaranin ini ke semua temen kamu.",
    "POV: kamu ga nyangka hasilnya bakal secepat ini.",
    "POV: ini jadi produk favorit baru kamu.",
  ],
};

/** Get random body scripts for a template */
export function getRandomBodyScripts(templateKey: ContentTemplateKey, count: number = 4): string[] {
  const scripts = BODY_SCRIPTS[templateKey] || [];
  const shuffled = [...scripts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
