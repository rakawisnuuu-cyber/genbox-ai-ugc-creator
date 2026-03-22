import { Image as ImageIcon } from "lucide-react";

const GeneratePage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] -mx-4 -my-4 lg:-mx-6 lg:-my-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
          <ImageIcon className="h-6 w-6 text-white/15" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/40">Image Studio</h2>
          <p className="text-[11px] text-white/20 mt-1">Coming soon — rebuilding from scratch</p>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
