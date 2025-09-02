import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { File, Loader2 } from "lucide-react";
import CopyPathButton from "@/components/CopyPathButton"; // or "./CopyPathButton"

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
}

export const FileResults = ({ results, isLoading = false }: FileResultsProps) => {
  const getFileTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      cut_file: "bg-red-100 text-red-700 border-red-300",
      assembly_instructions: "bg-green-100 text-green-700 border-green-300",
      print_files: "bg-blue-100 text-blue-700 border-blue-300",
      low_res: "bg-purple-100 text-purple-700 border-purple-300",
      mu_sheet: "bg-orange-100 text-orange-700 border-orange-300",
      pics: "bg-gray-100 text-gray-700 border-gray-300",
      set_up: "bg-yellow-100 text-yellow-700 border-yellow-300",
      technical_drawings: "bg-teal-100 text-teal-700 border-teal-300",
    };
    return colors[type?.toLowerCase()] ?? "bg-gray-100 text-gray-700 border-gray-300";
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

  if (!results.length) {
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
                <TableHead>Server Path</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-mono text-sm">{file.id}</TableCell>
                  <TableCell className="font-mono text-sm">{file.job_id}</TableCell>
                  <TableCell>{file.job_name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getFileTypeColor(file.resource_type)}>
                      {file.resource_type?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={file.filename}>
                    {file.filename || file.abs_path.split(/[\\/]/).pop() || "Unknown"}
                  </TableCell>
                  <TableCell className="max-w-[420px] truncate font-mono text-xs" title={file.abs_path}>
                    {file.abs_path}
                  </TableCell>
                  <TableCell>
                    <CopyPathButton path={file.abs_path} />
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
