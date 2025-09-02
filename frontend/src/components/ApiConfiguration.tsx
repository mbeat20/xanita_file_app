import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiConfigurationProps {
  apiBaseUrl: string;
  onApiBaseUrlChange: (url: string) => void;
}

export const ApiConfiguration = ({ apiBaseUrl, onApiBaseUrlChange }: ApiConfigurationProps) => {
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkConnection = async (url: string) => {
    if (!url.trim()) return false;
    
    setIsChecking(true);
    try {
      const response = await fetch(`${url}/health`);
      const result = response.ok && await response.json();
      return result?.ok === true;
    } catch {
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    const cleanUrl = tempUrl.trim().replace(/\/$/, '');
    const connected = await checkConnection(cleanUrl);
    
    if (connected) {
      onApiBaseUrlChange(cleanUrl);
      setIsConnected(true);
      toast({
        title: "API Connected",
        description: "Successfully connected to the backend API."
      });
    } else {
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to the API. Please check the URL and try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (apiBaseUrl) {
      checkConnection(apiBaseUrl).then(setIsConnected);
    }
  }, [apiBaseUrl]);

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          API Configuration
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto">
            {isConnected ? (
              <><CheckCircle className="h-3 w-3 mr-1" />Connected</>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" />Disconnected</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="api-url">Backend API URL</Label>
            <Input
              id="api-url"
              placeholder="http://localhost:8000"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSave}
            disabled={isChecking || !tempUrl.trim()}
            className="self-end"
          >
            {isChecking ? "Testing..." : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};