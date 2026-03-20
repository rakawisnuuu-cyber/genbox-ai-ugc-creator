import React from "react";
import { CONTENT_TEMPLATES, isRecommendedForCategory, type ContentTemplateKey } from "@/lib/content-templates";
import type { ProductCategory } from "@/lib/product-dna";

interface TemplateSelectStepProps {
  storyboardTemplate: ContentTemplateKey;
  productCategory: ProductCategory | undefined;
  hasPrompts: boolean;
  onSelect: (key: ContentTemplateKey) => void;
  onConfirmChange: (key: ContentTemplateKey) => void;
}

const TemplateSelectStep: React.FC<TemplateSelectStepProps> = ({
  storyboardTemplate,
  productCategory,
  hasPrompts,
  onSelect,
  onConfirmChange,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {[...CONTENT_TEMPLATES]
        .sort((a, b) => {
          if (!productCategory) return 0;
          const aRec = isRecommendedForCategory(a, productCategory) ? 0 : 1;
          const bRec = isRecommendedForCategory(b, productCategory) ? 0 : 1;
          return aRec - bRec;
        })
        .map((t, ti) => {
          const isSelected = storyboardTemplate === t.key;
          const isRecommended = productCategory ? isRecommendedForCategory(t, productCategory) : false;
          const accentColors = [
            "bg-blue-500",
            "bg-amber-500",
            "bg-emerald-500",
            "bg-rose-500",
            "bg-violet-500",
            "bg-cyan-500",
          ];
          const accent = accentColors[ti % accentColors.length];
          return (
            <button
              key={t.key}
              onClick={() => {
                if (hasPrompts && t.key !== storyboardTemplate) {
                  onConfirmChange(t.key);
                } else {
                  onSelect(t.key);
                }
              }}
              className={`relative text-left rounded-xl overflow-visible transition-all flex ${
                isSelected
                  ? "bg-primary/[0.04] border border-primary/30"
                  : isRecommended
                    ? "bg-primary/[0.03] border border-primary/20 hover:border-primary/30"
                    : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              {isRecommended && !isSelected && (
                <span className="absolute -top-2 -right-2 text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold z-10">
                  Recommended
                </span>
              )}
              <div className={`w-[2px] shrink-0 ${isSelected ? "bg-primary" : accent + "/30"}`} />
              <div className="px-3 py-2.5">
                <p className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-muted-foreground/40 line-clamp-1">{t.desc}</p>
              </div>
            </button>
          );
        })}
    </div>
  );
};

export default TemplateSelectStep;
