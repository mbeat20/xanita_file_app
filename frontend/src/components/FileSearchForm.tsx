import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";

interface SearchFilters {
  id?: number;
  job_id?: string;
  name?: string;
  year?: number;
  types: string[];
  limit: number;
}

interface FileSearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

type FileTypeOption = { label: string; value: string };

const FILE_TYPES: FileTypeOption[] = [
  { label: "MU Sheet", value: "mu_sheet" },
  { label: "Cut File", value: "cut_file" },
  { label: "Low Res", value: "low_res" },
  { label: "Assembly Instructions", value: "assembly_instructions" },
  { label: "Print File", value: "print_files" },
  { label: "Pictures", value: "pics" },
  { label: "Set Up Instructions", value: "set_up" },
  { label: "Technical Drawings", value: "technical_drawings" },
];

const FILE_TYPE_LABEL: Record<string, string> =
  Object.fromEntries(FILE_TYPES.map(o => [o.value, o.label]));

export const FileSearchForm = ({ onSearch, isLoading = false }: FileSearchFormProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    limit: 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const addType = (type: string) => {
    if (!filters.types.includes(type)) {
      setFilters({ ...filters, types: [...filters.types, type] });
    }
  };

  const removeType = (type: string) => {
    setFilters({ ...filters, types: filters.types.filter(t => t !== type) });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          File Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">File ID</Label>
              <Input
                id="id"
                type="number"
                placeholder="Enter file ID"
                value={filters.id || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    id: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_id">Job ID</Label>
              <Input
                id="job_id"
                placeholder="Enter job ID"
                value={filters.job_id || ""}
                onChange={(e) => setFilters({ ...filters, job_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Job Name</Label>
              <Input
                id="name"
                placeholder="Search by name"
                value={filters.name || ""}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="Enter year"
                value={filters.year || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    year: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limit Results</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="1000"
                value={filters.limit}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    limit: parseInt(e.target.value) || 100,
                  })
                }
              />
            </div>

            {/* Make File Types full width (optional). Remove sm:col-span-2 if you want it 1/2 width */}
            <div className="space-y-2">
              <Label htmlFor="types">File Types</Label>
              <Select onValueChange={addType}>
                <SelectTrigger>
                  <SelectValue placeholder="Add file type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected chips full width */}
            {filters.types.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Selected File Types</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.types.map((t) => (
                    <Badge key={t} variant="secondary" className="flex items-center gap-1">
                      {FILE_TYPE_LABEL[t] ?? t}
                      <button
                        type="button"
                        onClick={() => removeType(t)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
              {isLoading ? "Searching..." : "Search Files"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ types: [], limit: 100 })}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};