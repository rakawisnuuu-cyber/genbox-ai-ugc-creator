import { useState } from "react";
import { geminiFetch } from "@/lib/gemini-fetch";
import type { ProductDNA } from "@/lib/product-dna";
import { Loader2, Sparkles, Users, Target, Lightbulb, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface MediaInsights {
  product_name: string;
  category_label: string;
  key_features: string[];
  icp: {
    age_range: string;
    gender: string;
    interests: string[];
    pain_points: string[];
  };
  ad_hooks: string[];
  script_suggestions: string[];
  cta_options: string[];
}

interface Props {
  productDNA: ProductDNA | null;
  prompt: string;
  templateKey?: string;
  geminiKey: string;
  promptModel: string;
}

export default function MediaInsightsPanel({ productDNA, prompt, templateKey, geminiKey, promptModel }: Props) {
  const [insights, setInsights] = useState<MediaInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const analyze = async () => {
    if (!productDNA || !geminiKey) return;
    setLoading(true);
    try {
      const genConfig: Record<string, any> = {};
      if (promptModel !== "gemini-3.1-pro-preview") {
        genConfig.responseMimeType = "application/json";
      }

      const data = await geminiFetch(promptModel, geminiKey, {
        systemInstruction: {
          parts: [{ text: "You are an Indonesian UGC ad strategist. Analyze product data and generation context to provide actionable ad insights. Respond in Bahasa Indonesia for suggestions, English for technical fields. Return valid JSON only." }],
        },
        contents: [{
          parts: [{
            text: `Analyze this product and generation context for ad strategy insights.

PRODUCT DATA:
- Name/Brand: ${productDNA.brand_name}
- Category: ${productDNA.category} / ${productDNA.sub_category}
- Description: ${productDNA.product_description}
- Key Features: ${productDNA.key_features}
- Packaging: ${productDNA.packaging_type}
- Color: ${productDNA.dominant_color}

GENERATION CONTEXT:
- Prompt used: ${prompt.substring(0, 300)}
- Content template: ${templateKey || "single image"}

Return JSON:
{
  "product_name": "detected product name",
  "category_label": "human readable category in Indonesian",
  "key_features": ["feature1", "feature2", "feature3"],
  "icp": {
    "age_range": "18-35",
    "gender": "Wanita",
    "interests": ["skincare", "self-care"],
    "pain_points": ["kulit kusam", "breakout"]
  },
  "ad_hooks": ["3 hook variations for TikTok/Reels in Bahasa Indonesia, casual tone"],
  "script_suggestions": ["3 short script outlines in Bahasa Indonesia"],
  "cta_options": ["3 CTA variations in Bahasa Indonesia"]
}`
          }],
        }],
        generationConfig: genConfig,
      });

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned) as MediaInsights;
      setInsights(parsed);
      setExpanded(true);
    } catch (e: any) {
      toast.error("Gagal menganalisis: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (!productDNA) return null;

  if (!insights && !loading) {
    return (
      <button
        onClick={analyze}
        className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        Analisis Media & Generate Script Insights
      </button>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Menganalisis produk & konten...
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Media Insights
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Product */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Produk</p>
            <p className="text-sm font-semibold text-foreground">{insights.product_name}</p>
            <p className="text-[11px] text-muted-foreground">{insights.category_label}</p>
          </div>

          {/* Features */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Key Features</p>
            <div className="flex flex-wrap gap-1.5">
              {insights.key_features.map((f, i) => (
                <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>

          {/* ICP */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
              <Users className="w-3 h-3" /> Ideal Customer Profile
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-muted-foreground">Usia:</span> <span className="text-foreground">{insights.icp.age_range}</span></div>
              <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground">{insights.icp.gender}</span></div>
            </div>
            <div className="text-[11px]">
              <span className="text-muted-foreground">Interests: </span>
              <span className="text-foreground">{insights.icp.interests.join(", ")}</span>
            </div>
            <div className="text-[11px]">
              <span className="text-muted-foreground">Pain points: </span>
              <span className="text-foreground">{insights.icp.pain_points.join(", ")}</span>
            </div>
          </div>

          {/* Ad Hooks */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5 flex items-center gap-1">
              <Target className="w-3 h-3" /> Ad Hooks
            </p>
            <div className="space-y-1.5">
              {insights.ad_hooks.map((h, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <p className="text-[12px] text-foreground flex-1">"{h}"</p>
                  <button onClick={() => copyText(h)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Script Suggestions */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Script Ideas
            </p>
            <div className="space-y-1.5">
              {insights.script_suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <p className="text-[11px] text-muted-foreground flex-1">{s}</p>
                  <button onClick={() => copyText(s)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">CTA Options</p>
            <div className="flex flex-wrap gap-1.5">
              {insights.cta_options.map((c, i) => (
                <button key={i} onClick={() => copyText(c)} className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
