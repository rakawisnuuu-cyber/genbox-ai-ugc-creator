import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserCircle, X, Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CharacterData } from "./CharacterCard";

interface CharacterDetailModalProps {
  character: CharacterData | null;
  open: boolean;
  onClose: () => void;
  onUse: (character: CharacterData) => void;
  onDelete?: (character: CharacterData) => void;
}

const CharacterDetailModal = ({ character, open, onClose, onUse, onDelete }: CharacterDetailModalProps) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset lightbox when character changes or modal closes
  useEffect(() => {
    setLightboxUrl(null);
  }, [character?.id, open]);

  if (!character) return null;

  const tags = [character.type, character.age_range, character.style].filter(Boolean);
  const refImages = character.reference_images?.filter(Boolean) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-[#141414] border-[#2A2A2A] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-satoshi text-xl">{character.name}</DialogTitle>
            <DialogDescription className="sr-only">Detail karakter {character.name}</DialogDescription>
          </DialogHeader>

          {/* Preview */}
          {character.hero_image_url ? (
            <img src={character.hero_image_url} alt={character.name} className="w-full aspect-[4/3] rounded-xl object-cover cursor-pointer" onClick={() => setLightboxUrl(character.hero_image_url!)} />
          ) : (
            <div className={`w-full aspect-[4/3] rounded-xl bg-gradient-to-b ${character.gradient_from} ${character.gradient_to} flex items-center justify-center`}>
              <UserCircle className="h-20 w-20 text-[#444]" />
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((t) => (
              <span key={t} className="bg-[#2A2A2A] text-[#888] text-[11px] px-2.5 py-1 rounded-full">{t}</span>
            ))}
            <span className={`text-[11px] px-2.5 py-1 rounded-full ${character.is_preset ? "bg-[#2A2A2A] text-[#888]" : "bg-primary/20 text-primary"}`}>
              {character.is_preset ? "PRESET" : "CUSTOM"}
            </span>
          </div>

          {/* Reference Photo */}
          {character.reference_photo_url && (
            <div className="mt-2">
              <p className="text-xs uppercase tracking-widest text-[#666] mb-2">Foto Referensi</p>
              <div className="flex items-center gap-3">
                <img
                  src={character.reference_photo_url}
                  alt="Reference"
                  className="h-16 w-16 rounded-full object-cover border border-[#2A2A2A] cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLightboxUrl(character.reference_photo_url!)}
                />
                <p className="text-[11px] text-[#888]">Foto asli yang digunakan sebagai referensi wajah</p>
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-[#999] mt-2 leading-relaxed">{character.description}</p>

          {/* 6-shot grid */}
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-[#666] mb-3">Contoh Foto</p>
            <div className="grid grid-cols-3 gap-2">
              {refImages.length > 0
                ? refImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Shot ${i + 1}`}
                      className="aspect-square rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxUrl(url)}
                    />
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-[#333]" />
                    </div>
                  ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onUse(character)}
              className="flex-1 bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              GUNAKAN
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-[#2A2A2A] text-[#888] font-bold text-sm py-2.5 rounded-lg hover:text-white hover:border-[#444] transition-colors"
            >
              TUTUP
            </button>
            {onDelete && !character.is_preset && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="border border-destructive/30 text-destructive font-bold text-sm py-2.5 px-3 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          tabIndex={0}
        >
          <button className="fixed top-4 right-4 text-white/70 hover:text-white z-[101]" onClick={() => setLightboxUrl(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxUrl} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <a
            href={lightboxUrl}
            download="character-image.jpg"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus karakter "{character.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Karakter yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete!(character);
                setShowDeleteConfirm(false);
                onClose();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CharacterDetailModal;
