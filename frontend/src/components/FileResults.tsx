import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileResult {
  id: number;
  job_id: string;
  resource_type: string;
  abs_path: string;
  job_name?: string;
  filename?: string;
}

interface FileResultsProps {
  results: FileResult[];
  isLoading?: boolean;
  apiBaseUrl: string;
}

export const FileResults = ({ results, isLoading = false, apiBaseUrl }: FileResultsProps) => {
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleDownload = async (id: number, filename?: string) => {
    setDownloadingIds(prev => new Set([...prev, id]));
    
    try {
      const response = await fetch(`${apiBaseUrl}/resources/${id}`);
      
      if (!response.ok) {
        if (response.status === 410) {
          toast({
            title: "File Missing",
            description: "This file is no longer available on disk.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || `file_${id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `${filename || `File ${id}`} is downloading...`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "An error occurred while downloading the file.",
        variant: "destructive"
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getFileTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'cut_file': 'bg-red-100 text-red-700 border-red-300',
      'assembly_instructions': 'bg-green-100 text-green-700 border-green-300',
      'print_files': 'bg-blue-100 text-blue-700 border-blue-300',
      'low_res': 'bg-purple-100 text-purple-700 border-purple-300',
      'mu_sheet': 'bg-orange-100 text-orange-700 border-orange-300',
      'pics': 'bg-gray-100 text-gray-700 border-gray-300',
      'set_up': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'technical_drawings': 'bg-teal-100 text-teal-700 border-teal-300'
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <File className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No files found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria to find files.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Search Results ({results.length} files)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Job ID</TableHead>
                <TableHead>Job Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-mono text-sm">{file.id}</TableCell>
                  <TableCell className="font-mono text-sm">{file.job_id}</TableCell>
                  <TableCell>{file.job_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getFileTypeColor(file.resource_type)}>
                      {file.resource_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={file.filename}>
                    {file.filename || file.abs_path.split('/').pop() || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(file.id, file.filename)}
                      disabled={downloadingIds.has(file.id)}
                      className="w-full"
                    >
                      {downloadingIds.has(file.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};