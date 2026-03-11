import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Key, CheckCircle2, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "intro" | "kie" | "gemini" | "done";

const STEPS: { key: Step; title: string }[] = [
  { key: "intro", title: "Welcome" },
  { key: "kie", title: "Kie AI" },
  { key: "gemini", title: "Gemini" },
  { key: "done", title: "Selesai" },
];

export default function ApiKeySetupModal({ open, onClose }: Props) {
  const { keys, saveKey, testKey, setLocalKey, savingProvider, testingProvider } = useApiKeys();
  const [step, setStep] = useState<Step>("intro");
  const [showKie, setShowKie] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleSaveAndNext = async (provider: "kie_ai" | "gemini", next: Step) => {
    const key = keys[provider].key;
    if (!key.trim()) return;
    await saveKey(provider, key);
    setStep(next);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-satoshi text-lg">
            {step === "intro" && "Selamat Datang di GENBOX 🎉"}
            {step === "kie" && "Setup API Key — Kie AI"}
            {step === "gemini" && "Setup API Key — Google Gemini"}
            {step === "done" && "Setup Selesai! ✓"}
          </DialogTitle>
          <DialogDescription>
            {step === "intro" && "Sebelum mulai generate, kamu perlu setup 2 API key."}
            {step === "kie" && "Kie AI digunakan untuk generate gambar dan video."}
            {step === "gemini" && "Gemini digunakan untuk generate prompt dan analisis produk."}
            {step === "done" && "Semua API key sudah tersimpan. Kamu siap mulai!"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1.5 mt-2">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {/* INTRO */}
          {step === "intro" && (
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <Key className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Kie AI API Key</p>
                    <p className="text-xs text-muted-foreground">Untuk generate gambar & video UGC</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <Key className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Google Gemini API Key</p>
                    <p className="text-xs text-muted-foreground">Untuk generate prompt & analisis produk</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                API key kamu tersimpan aman di database. GENBOX tidak menyimpan key di browser.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Nanti Saja
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep("kie")}>
                  Mulai Setup <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}

          {/* KIE AI */}
          {step === "kie" && (
            <>
              <div className="space-y-3">
                <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Cara mendapatkan Kie AI API Key:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Buka <a href="https://kie.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">kie.ai <ExternalLink className="h-2.5 w-2.5" /></a></li>
                    <li>Daftar atau login ke akun kamu</li>
                    <li>Buka halaman API Keys di dashboard</li>
                    <li>Buat API key baru dan copy</li>
                  </ol>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Kie AI API Key</label>
                  <div className="relative">
                    <Input
                      type={showKie ? "text" : "password"}
                      placeholder="Paste API key di sini..."
                      value={keys.kie_ai.key}
                      onChange={(e) => setLocalKey("kie_ai", e.target.value)}
                      className="pr-10 bg-background border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKie(!showKie)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKie ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {keys.kie_ai.status === "valid" && (
                    <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Key valid</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testKey("kie_ai")}
                  disabled={!keys.kie_ai.key || testingProvider === "kie_ai"}
                >
                  {testingProvider === "kie_ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test Key"}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleSaveAndNext("kie_ai", "gemini")}
                  disabled={!keys.kie_ai.key.trim() || savingProvider === "kie_ai"}
                >
                  {savingProvider === "kie_ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Simpan & Lanjut <ArrowRight className="h-3.5 w-3.5" /></>}
                </Button>
              </div>
            </>
          )}

          {/* GEMINI */}
          {step === "gemini" && (
            <>
              <div className="space-y-3">
                <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Cara mendapatkan Google Gemini API Key:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Buka <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="h-2.5 w-2.5" /></a></li>
                    <li>Login dengan akun Google</li>
                    <li>Klik "Create API Key"</li>
                    <li>Copy API key yang muncul</li>
                  </ol>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Gemini API Key</label>
                  <div className="relative">
                    <Input
                      type={showGemini ? "text" : "password"}
                      placeholder="Paste API key di sini..."
                      value={keys.gemini.key}
                      onChange={(e) => setLocalKey("gemini", e.target.value)}
                      className="pr-10 bg-background border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {keys.gemini.status === "valid" && (
                    <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Key valid</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testKey("gemini")}
                  disabled={!keys.gemini.key || testingProvider === "gemini"}
                >
                  {testingProvider === "gemini" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test Key"}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleSaveAndNext("gemini", "done")}
                  disabled={!keys.gemini.key.trim() || savingProvider === "gemini"}
                >
                  {savingProvider === "gemini" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Simpan & Selesai <CheckCircle2 className="h-3.5 w-3.5" /></>}
                </Button>
              </div>
            </>
          )}

          {/* DONE */}
          {step === "done" && (
            <>
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-foreground font-medium">API keys berhasil disimpan!</p>
                <p className="text-xs text-muted-foreground mt-1">Kamu sudah bisa mulai generate gambar dan video UGC.</p>
              </div>
              <Button className="w-full" onClick={onClose}>
                Mulai Generate
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
