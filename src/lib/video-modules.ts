export type ModuleType = "hook" | "problem" | "demo" | "proof" | "cta" | "transition" | "broll";

export interface VideoModule {
  id: string;
  type: ModuleType;
  duration: number;
  prompt: string;
  source: "character" | "product" | "custom" | "text_only";
  video_url: string | null;
  thumbnail_url: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  customImageUrl?: string;
  withDialogue: boolean;
  scriptTemplate?: string | null;
  dialogueText?: string | null;
  audioDirection?: string | null;
}

export interface VideoProject {
  id: string;
  user_id: string;
  title: string;
  template: "ugc_ad" | "educational" | "showcase" | "story" | "custom";
  character_id: string | null;
  product_image_url: string | null;
  modules: VideoModule[];
  final_video_url: string | null;
  total_duration: number;
  aspect_ratio: "9:16" | "16:9";
  model: "veo3_fast" | "veo3" | "grok";
  with_dialogue: boolean;
  status: "draft" | "generating" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export const MODULE_LIBRARY: Record<ModuleType, {
  label: string;
  labelId: string;
  icon: string;
  description: string;
  descriptionId: string;
  defaultDuration: number;
  promptStrategy: string;
  color: string;
  defaultDialogue: boolean;
  audioStrategy: string;
  exampleScript: string | null;
}> = {
  hook: {
    label: "HOOK",
    labelId: "Hook",
    icon: "Zap",
    description: "Stop the scroll. First 3 seconds determine if user watches.",
    descriptionId: "Hentikan scrolling. 3 detik pertama menentukan segalanya.",
    defaultDuration: 3,
    promptStrategy: "Close-up face, dramatic expression, hand reaching for product. Fast motion, high energy.",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    defaultDialogue: true,
    audioStrategy: "High energy opening. If dialogue: excited first impression line. Audio: ambient setting sounds, energetic feel.",
    exampleScript: "Guys kalian HARUS tau soal ini... sumpah game changer!",
  },
  problem: {
    label: "PROBLEM",
    labelId: "Problem",
    icon: "AlertCircle",
    description: "Establish relatable pain point. Build emotional connection.",
    descriptionId: "Tunjukkan masalah yang relatable. Bangun koneksi emosional.",
    defaultDuration: 4,
    promptStrategy: "Person looking frustrated/confused. Real-world setting (bathroom, kitchen, desk). Natural expression, candid feel.",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    defaultDialogue: true,
    audioStrategy: "Relatable frustration. If dialogue: describe the pain point naturally. Audio: quiet setting, slightly muted/dim energy.",
    exampleScript: "Udah coba segalanya tapi tetep aja...",
  },
  demo: {
    label: "DEMO",
    labelId: "Demo",
    icon: "Clapperboard",
    description: "Show product in action. The money shot.",
    descriptionId: "Tunjukkan produk beraksi. The money shot.",
    defaultDuration: 7,
    promptStrategy: "Hands holding product, applying/using it. Well-lit, product label visible. Medium shot showing face + product.",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    defaultDialogue: false,
    audioStrategy: "Focus on product sounds: applying, opening, texture. Audio: clear ambient, product interaction sounds. Dialogue optional.",
    exampleScript: "Cara pakainya gampang banget, tinggal...",
  },
  proof: {
    label: "PROOF",
    labelId: "Bukti",
    icon: "CheckCircle",
    description: "Social proof or results. Build credibility.",
    descriptionId: "Bukti sosial atau hasil. Bangun kredibilitas.",
    defaultDuration: 4,
    promptStrategy: "Satisfied expression, before/after framing, showing result. Close-up of improved area.",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    defaultDialogue: true,
    audioStrategy: "Satisfaction and result. If dialogue: share genuine reaction to results. Audio: bright, warm, positive energy.",
    exampleScript: "Beneran kerasa bedanya... fix worth it!",
  },
  cta: {
    label: "CTA",
    labelId: "Call to Action",
    icon: "MousePointerClick",
    description: "Drive action. Tell viewer exactly what to do next.",
    descriptionId: "Ajak aksi. Arahkan penonton untuk bertindak.",
    defaultDuration: 3,
    promptStrategy: "Person holding product toward camera, warm smile, direct eye contact. Product prominently displayed. Clean background.",
    color: "bg-primary/20 text-primary border-primary/30",
    defaultDialogue: true,
    audioStrategy: "Direct, friendly, action-driving. Dialogue MUST include CTA phrase. Audio: warm, clear, intimate.",
    exampleScript: "Langsung cek di keranjang kuning ya!",
  },
  transition: {
    label: "TRANSITION",
    labelId: "Transisi",
    icon: "ArrowRightLeft",
    description: "Smooth scene change. Pace reset.",
    descriptionId: "Perpindahan scene yang halus.",
    defaultDuration: 2,
    promptStrategy: "Product flat lay, overhead shot, or environment establishing shot. Slow camera movement.",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    defaultDialogue: false,
    audioStrategy: "No dialogue. Audio: ambient transition sounds, gentle energy shift.",
    exampleScript: null,
  },
  broll: {
    label: "B-ROLL",
    labelId: "B-Roll",
    icon: "Camera",
    description: "Supplementary footage. Texture, lifestyle, aesthetic.",
    descriptionId: "Footage tambahan. Estetik, lifestyle, suasana.",
    defaultDuration: 3,
    promptStrategy: "Lifestyle scene without direct product focus. Aesthetic environment, morning routine, desk setup.",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    defaultDialogue: false,
    audioStrategy: "No dialogue. Audio: lifestyle ambient sounds matching the scene.",
    exampleScript: null,
  }
};

export const VIDEO_TEMPLATES = {
  ugc_ad: {
    name: "UGC-Style Ad",
    nameId: "Iklan UGC",
    description: "TikTok Shop, product promotion, affiliate marketing",
    descriptionId: "TikTok Shop, promosi produk, affiliate marketing",
    duration: "15-20 detik",
    icon: "Smartphone",
    modules: [
      { type: "hook" as ModuleType, duration: 3, source: "character" as const, withDialogue: true },
      { type: "problem" as ModuleType, duration: 4, source: "character" as const, withDialogue: true },
      { type: "demo" as ModuleType, duration: 7, source: "character" as const, withDialogue: false },
      { type: "proof" as ModuleType, duration: 4, source: "character" as const, withDialogue: true },
      { type: "cta" as ModuleType, duration: 2, source: "character" as const, withDialogue: true },
    ]
  },
  educational: {
    name: "Educational Content",
    nameId: "Konten Edukasi",
    description: "Tutorial, how-to, tips & tricks",
    descriptionId: "Tutorial, cara pakai, tips & trik",
    duration: "25-30 detik",
    icon: "BookOpen",
    modules: [
      { type: "hook" as ModuleType, duration: 3, source: "character" as const, withDialogue: true },
      { type: "broll" as ModuleType, duration: 2, source: "text_only" as const, withDialogue: false },
      { type: "demo" as ModuleType, duration: 10, source: "character" as const, withDialogue: true },
      { type: "proof" as ModuleType, duration: 7, source: "character" as const, withDialogue: true },
      { type: "transition" as ModuleType, duration: 2, source: "product" as const, withDialogue: false },
      { type: "cta" as ModuleType, duration: 6, source: "character" as const, withDialogue: true },
    ]
  },
  showcase: {
    name: "Product Showcase",
    nameId: "Showcase Produk",
    description: "Product launch, hero content, brand awareness",
    descriptionId: "Peluncuran produk, konten hero, brand awareness",
    duration: "15 detik",
    icon: "Gem",
    modules: [
      { type: "hook" as ModuleType, duration: 2, source: "character" as const, withDialogue: false },
      { type: "demo" as ModuleType, duration: 6, source: "product" as const, withDialogue: false },
      { type: "broll" as ModuleType, duration: 4, source: "text_only" as const, withDialogue: false },
      { type: "cta" as ModuleType, duration: 3, source: "character" as const, withDialogue: true },
    ]
  },
  story: {
    name: "Storytelling Format",
    nameId: "Format Cerita",
    description: "Emotional narrative, brand story, testimonial",
    descriptionId: "Narasi emosional, cerita brand, testimoni",
    duration: "30 detik",
    icon: "BookMarked",
    modules: [
      { type: "hook" as ModuleType, duration: 3, source: "character" as const, withDialogue: true },
      { type: "problem" as ModuleType, duration: 7, source: "character" as const, withDialogue: true },
      { type: "transition" as ModuleType, duration: 2, source: "product" as const, withDialogue: false },
      { type: "demo" as ModuleType, duration: 8, source: "character" as const, withDialogue: false },
      { type: "proof" as ModuleType, duration: 7, source: "character" as const, withDialogue: true },
      { type: "cta" as ModuleType, duration: 3, source: "character" as const, withDialogue: true },
    ]
  }
};
