import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X } from "lucide-react";

const names = [
  "Andi R. dari Jakarta",
  "Sari M. dari Bandung",
  "Budi K. dari Surabaya",
  "Rina P. dari Yogyakarta",
  "Dimas W. dari Semarang",
  "Putri A. dari Medan",
  "Fajar H. dari Makassar",
  "Nisa D. dari Bali",
  "Rizky S. dari Tangerang",
  "Ayu L. dari Bekasi",
];

const times = [
  "2 menit lalu",
  "5 menit lalu",
  "8 menit lalu",
  "12 menit lalu",
  "15 menit lalu",
  "23 menit lalu",
  "37 menit lalu",
  "1 jam lalu",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TransactionPopup = () => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState({ name: "", time: "" });
  const [queue] = useState(() => shuffle(names));
  const [index, setIndex] = useState(0);

  const isNearBottom = useCallback(() => {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    return docHeight - scrollBottom < 300;
  }, []);

  useEffect(() => {
    let showTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;
    let cycleTimeout: ReturnType<typeof setTimeout>;

    const show = () => {
      if (document.hidden || isNearBottom()) {
        cycleTimeout = setTimeout(show, 5000);
        return;
      }
      const name = queue[index % queue.length];
      const time = times[Math.floor(Math.random() * times.length)];
      setCurrent({ name, time });
      setVisible(true);
      setIndex((prev) => prev + 1);

      hideTimeout = setTimeout(() => setVisible(false), 4000);
      const nextDelay = 12000 + Math.random() * 6000;
      cycleTimeout = setTimeout(show, nextDelay);
    };

    const initialDelay = setTimeout(() => show(), 5000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      clearTimeout(cycleTimeout);
    };
  }, [index, queue, isNearBottom]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[300px] animate-slide-up rounded-xl border border-border bg-card/95 p-3 pr-5 shadow-lg backdrop-blur-md">
      <button
        onClick={() => setVisible(false)}
        className="absolute right-1 top-1 p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X size={12} />
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 size={16} className="text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {current.name} baru saja bergabung
          </p>
          <p className="text-xs text-muted-foreground">{current.time}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionPopup;
