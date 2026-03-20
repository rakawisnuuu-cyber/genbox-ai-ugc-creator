import React from "react";
import { Upload, X, Loader2, ScanSearch, ChevronDown, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_CATEGORIES,
  type ProductDNA,
  type ProductCategory,
} from "@/lib/product-dna";

interface ProductUploadStepProps {
  productPreview: string | null;
  productUrl: string | null;
  productDNA: ProductDNA | null;
  detectingDNA: boolean;
  uploading: boolean;
  dnaExpanded: boolean;
  setDnaExpanded: (v: boolean) => void;
  setProductDNA: React.Dispatch<React.SetStateAction<ProductDNA | null>>;
  handleFileSelect: (file: File) => void;
  removeProduct: () => void;
  onDrop: (e: React.DragEvent) => void;
}

const ProductUploadStep: React.FC<ProductUploadStepProps> = ({
  productPreview,
  productUrl,
  productDNA,
  detectingDNA,
  uploading,
  dnaExpanded,
  setDnaExpanded,
  setProductDNA,
  handleFileSelect,
  removeProduct,
  onDrop,
}) => {
  if (productPreview) {
    return (
      <div className="border border-white/[0.06] rounded-2xl bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={productPreview}
              alt="Product"
              className="h-24 w-24 rounded-xl object-cover border border-white/[0.06]"
            />
            <button
              onClick={removeProduct}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          {/* Product DNA card */}
          <div className="flex-1 min-w-0">
            {detectingDNA && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ScanSearch className="h-3.5 w-3.5 animate-pulse" />
                <span>Mendeteksi produk...</span>
              </div>
            )}
            {productDNA && !detectingDNA && (
              <div className="space-y-0">
                {/* Collapsed header row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={productDNA.category}
                    onValueChange={(val) =>
                      setProductDNA((prev) => (prev ? { ...prev, category: val as ProductCategory } : prev))
                    }
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs bg-primary/10 border-primary/20 text-primary font-semibold px-2.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productDNA.sub_category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground/60">
                      {productDNA.sub_category}
                    </span>
                  )}
                  {productDNA.dominant_color && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground/60">
                      {productDNA.dominant_color}
                    </span>
                  )}
                  <button
                    onClick={() => setDnaExpanded(!dnaExpanded)}
                    className="ml-auto text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${dnaExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
                {productDNA.product_description && (
                  <p className="text-[13px] text-foreground line-clamp-1 mt-1.5">
                    {productDNA.product_description}
                  </p>
                )}

                {/* Expanded detail grid */}
                {dnaExpanded && (
                  <div className="pt-3 mt-3 border-t border-white/[0.04] space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {productDNA.material && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/25">
                            Material
                          </p>
                          <p className="text-[12px] text-muted-foreground/60 mt-0.5">{productDNA.material}</p>
                        </div>
                      )}
                      {productDNA.brand_name && productDNA.brand_name !== "unknown" && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/25">Brand</p>
                          <p className="text-[12px] text-muted-foreground/60 mt-0.5">{productDNA.brand_name}</p>
                        </div>
                      )}
                      {productDNA.key_features && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/25">
                            Key Features
                          </p>
                          <p className="text-[12px] text-muted-foreground/60 mt-0.5">{productDNA.key_features}</p>
                        </div>
                      )}
                      {productDNA.usage_type && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/25">
                            Usage Type
                          </p>
                          <p className="text-[12px] text-muted-foreground/60 mt-0.5">{productDNA.usage_type}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/20">
                      <Info className="h-3 w-3 shrink-0" />
                      <span>AI uses this to generate accurate product placement</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("!border-primary/30");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("!border-primary/30");
      }}
      onDrop={(e) => {
        e.currentTarget.classList.remove("!border-primary/30");
        onDrop(e);
      }}
      onClick={() => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "image/jpeg,image/png,image/webp";
        inp.onchange = (e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) handleFileSelect(f);
        };
        inp.click();
      }}
      className="border border-white/[0.06] rounded-2xl bg-white/[0.02] p-8 hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
    >
      <Upload className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground/40">Drag & drop foto produk</p>
      <p className="text-xs text-muted-foreground/30">atau klik untuk pilih file</p>
      <p className="text-[11px] text-muted-foreground/20">JPEG, PNG, WebP — Maks 10MB</p>
    </div>
  );
};

export default ProductUploadStep;
