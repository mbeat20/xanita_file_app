import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = { path: string; label?: string };

export default function CopyPathButton({ path, label = "Copy path" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      toast.success("Path copied to clipboard", { description: path, duration: 1500 });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers: textarea hack
      const ta = document.createElement("textarea");
      ta.value = path;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Path copied to clipboard", { description: path, duration: 1500 });
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Could not copy the path. Please copy it manually.");
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <Button onClick={copy} variant="outline" size="sm" className="gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}
