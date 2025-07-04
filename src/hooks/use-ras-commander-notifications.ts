import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RasCommanderStatus {
  available: boolean;
  version?: string;
  message: string;
}

export function useRasCommanderNotifications() {
  const [status, setStatus] = useState<RasCommanderStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkRasCommanderStatus = async () => {
    setIsChecking(true);
    try {
      // This would be replaced with actual PyTauri call
      // const result = await pyInvoke<RasCommanderStatus>('check_ras_commander_status');

      // Mock response for now
      const result: RasCommanderStatus = {
        available: false,
        message: "ras-commander not available in development mode",
      };

      setStatus(result);

      if (result.available) {
        toast({
          title: "RAS Commander Available",
          description: `Version ${result.version} is ready for use`,
          variant: "default",
        });
      } else {
        toast({
          title: "RAS Commander Status",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setStatus({
        available: false,
        message: `Error checking RAS Commander: ${errorMessage}`,
      });

      toast({
        title: "Error",
        description: `Failed to check RAS Commander status: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check status on mount
    checkRasCommanderStatus();
  }, []);

  const showRasCommanderStatus = (
    available: boolean,
    version?: string,
    message?: string
  ) => {
    if (available) {
      toast({
        title: "RAS Commander Available",
        description: `Version ${version} is ready for use`,
        variant: "default",
      });
    } else {
      toast({
        title: "RAS Commander Status",
        description: message || "RAS Commander not available",
        variant: "destructive",
      });
    }
  };

  const showError = (title: string, message: string) => {
    toast({
      title,
      description: message,
      variant: "destructive",
    });
  };

  const showSuccess = (title: string, message: string) => {
    toast({
      title,
      description: message,
      variant: "default",
    });
  };

  return {
    status,
    isChecking,
    checkStatus: checkRasCommanderStatus,
    isAvailable: status?.available ?? false,
    showRasCommanderStatus,
    showError,
    showSuccess,
  };
}
