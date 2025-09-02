import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search } from "lucide-react";

interface MaterialUsageFilters {
  job_id?: string;
  name?: string;
  xb_type?: string;
  thickness?: string;
  size?: string;
  units_up?: number;
  width?: number;
  height?: number;
  depth?: number;
  limit: number;
}

interface MaterialUsageFormProps {
  onSearch: (filters: MaterialUsageFilters) => void;
  isLoading?: boolean;
}

export const MaterialUsageForm = ({ onSearch, isLoading = false }: MaterialUsageFormProps) => {
  const [filters, setFilters] = useState<MaterialUsageFilters>({
    limit: 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Material Usage Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mu_job_id">Job ID</Label>
              <Input
                id="mu_job_id"
                placeholder="Enter job ID"
                value={filters.job_id || ""}
                onChange={(e) => setFilters({ ...filters, job_id: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mu_name">Job Name</Label>
              <Input
                id="mu_name"
                placeholder="Search by name"
                value={filters.name || ""}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="xb_type">XB Type</Label>
              <Input
                id="xb_type"
                placeholder="Enter XB type"
                value={filters.xb_type || ""}
                onChange={(e) => setFilters({ ...filters, xb_type: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="thickness">Thickness (mm)</Label>
              <Input
                id="thickness"
                placeholder="Enter thickness"
                value={filters.thickness || ""}
                onChange={(e) => setFilters({ ...filters, thickness: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="Enter size"
                value={filters.size || ""}
                onChange={(e) => setFilters({ ...filters, size: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="units_up">Units Up</Label>
              <Input
                id="units_up"
                type="number"
                step="0.1"
                placeholder="Enter units up"
                value={filters.units_up || ""}
                onChange={(e) => setFilters({ ...filters, units_up: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mu_width">Width (mm)</Label>
              <Input
                id="mu_width"
                type="number"
                placeholder="Enter width"
                value={filters.width || ""}
                onChange={(e) => setFilters({ ...filters, width: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mu_height">Height (mm)</Label>
              <Input
                id="mu_height"
                type="number"
                placeholder="Enter height"
                value={filters.height || ""}
                onChange={(e) => setFilters({ ...filters, height: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mu_depth">Depth (mm)</Label>
              <Input
                id="mu_depth"
                type="number"
                placeholder="Enter depth"
                value={filters.depth || ""}
                onChange={(e) => setFilters({ ...filters, depth: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mu_limit">Limit Results</Label>
              <Input
                id="mu_limit"
                type="number"
                min="1"
                max="1000"
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1 md:flex-none">
              {isLoading ? "Searching..." : "Search Materials"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ limit: 100 })}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};