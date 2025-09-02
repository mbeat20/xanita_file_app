import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSearchForm } from "@/components/FileSearchForm";
import { MaterialUsageForm } from "@/components/MaterialUsageForm";
import { FileResults } from "@/components/FileResults";
import { ApiConfiguration } from "@/components/ApiConfiguration";
import { Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import xanitaLogo from "@/assets/xanita-logo.png";

interface FileResult {
  id: number;
  job_id: string;
  resource_type: string;
  abs_path: string;
  job_name?: string;
  filename?: string;
}

const DEFAULT_API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const Index = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);

  const [searchResults, setSearchResults] = useState<FileResult[]>([]);
  const [materialResults, setMaterialResults] = useState<FileResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isMaterialLoading, setIsMaterialLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSearch = async (filters: any) => {
    setIsSearchLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
          if (Array.isArray(value)) value.forEach(v => params.append(key, v as string));
          else params.append(key, String(value));
        }
      });
      const response = await fetch(`${apiBaseUrl}/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
      const results = await response.json();
      setSearchResults(results);
      toast({ title: "Search Complete", description: `Found ${results.length} files matching your criteria.` });
    } catch (error) {
      toast({ title: "Search Failed", description: error instanceof Error ? error.message : "An error occurred while searching.", variant: "destructive" });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleMaterialSearch = async (filters: any) => {
    setIsMaterialLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== 0) params.append(key, String(value));
      });
      const response = await fetch(`${apiBaseUrl}/material_usage?${params.toString()}`);
      if (!response.ok) throw new Error(`Material search failed: ${response.statusText}`);
      const results = await response.json();
      setMaterialResults(results);
      toast({ title: "Material Search Complete", description: `Found ${results.length} material usage files matching your criteria.` });
    } catch (error) {
      toast({ title: "Material Search Failed", description: error instanceof Error ? error.message : "An error occurred while searching materials.", variant: "destructive" });
    } finally {
      setIsMaterialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src={xanitaLogo} alt="Xanita" className="h-12 w-auto" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">File Search</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search and download company files with advanced filtering options.
            Access job files, material usage reports, and technical documents.
          </p>
        </div>

        {/* Dev-only API box (optional) */}
        {import.meta.env.DEV && (
          <ApiConfiguration apiBaseUrl={apiBaseUrl} onApiBaseUrlChange={setApiBaseUrl} />
        )}

        {/* Main Search Interface */}
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Search className="h-4 w-4" /> File Search
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Material Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-6">
            <FileSearchForm onSearch={handleFileSearch} isLoading={isSearchLoading} />
            <FileResults results={searchResults} isLoading={isSearchLoading} />
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <MaterialUsageForm onSearch={handleMaterialSearch} isLoading={isMaterialLoading} />
            <FileResults results={materialResults} isLoading={isMaterialLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
