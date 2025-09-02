// frontend/src/components/CopyPathButton.tsx
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CopyPathButton({
  path,
  label = "Copy path",
}: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      toast.success("Path copied", { description: path, duration: 1500 });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = path;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Path copied", { description: path, duration: 1500 });
        setTimeout(() => setCopied(false), 1200);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <Button type="button" onClick={onClick} variant="outline" size="sm" className="gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}
