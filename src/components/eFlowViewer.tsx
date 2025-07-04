/**
 * eFlow Viewer - Main visualization interface for HEC-RAS 2D projects
 */

import { useState, useCallback, useEffect } from "react";
import {
  AlertCircle,
  FolderOpen,
  Loader2,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { Alert, AlertDescription } from "./ui/Alert";
import { ProjectSidebar } from "./ProjectSidebar";
import { VtkViewer } from "./VtkViewer";
import { useTheme } from "../contexts/ThemeContext";
import { useRasCommanderNotifications } from "../hooks/use-ras-commander-notifications";
import {
  ProjectStructureResponse,
  ProjectTreeNode,
  VtkViewerData,
  RasCommanderStatus,
} from "../types/ras-commander";
import {
  selectProjectFolder,
  analyzeProjectStructure,
  checkRasCommanderStatus,
  initializeProject,
} from "../lib/tauri-commands";

interface eFlowViewerState {
  projectData: ProjectStructureResponse | null;
  selectedFile: VtkViewerData | null;
  loading: boolean;
  error: string | null;
  rasStatus: RasCommanderStatus | null;
}

interface EFlowViewerProps {
  onBackToHome: () => void;
}

export default function EFlowViewer({ onBackToHome }: EFlowViewerProps) {
  const { theme, toggleTheme } = useTheme();
  const notifications = useRasCommanderNotifications();
  const [state, setState] = useState<eFlowViewerState>({
    projectData: null,
    selectedFile: null,
    loading: false,
    error: null,
    rasStatus: null,
  });

  // Check ras-commander status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log("🚀 eFlowViewer: Starting ras-commander status check...");
        const status = await checkRasCommanderStatus();
        console.log("🎯 eFlowViewer: Received status:", status);
        setState((prev) => ({ ...prev, rasStatus: status }));
      } catch (error) {
        console.error(
          "❌ eFlowViewer: Failed to check ras-commander status:",
          error
        );
      }
    };

    checkStatus();
  }, []);

  // Debug function to manually test ras-commander status
  const handleDebugRasCommander = useCallback(async () => {
    console.log("🔧 DEBUG: Manual ras-commander status check triggered");
    try {
      const status = await checkRasCommanderStatus();
      console.log("🔧 DEBUG: Manual status result:", status);
      setState((prev) => ({ ...prev, rasStatus: status }));

      // Show elegant notification instead of alert
      notifications.showRasCommanderStatus(
        status.available,
        status.version,
        status.message
      );
    } catch (error) {
      console.error("🔧 DEBUG: Manual status check failed:", error);
      notifications.showError(
        "Error de Conexión",
        `No se pudo verificar el estado: ${error}`
      );
    }
  }, [notifications]);

  const handleLoadProject = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Open folder picker
      const folderPath = await selectProjectFolder();
      if (!folderPath) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Analyze project structure
      const projectData = await analyzeProjectStructure({
        project_path: folderPath,
      });

      if (projectData.error) {
        throw new Error(projectData.error);
      }

      // Initialize project with ras-commander
      try {
        await initializeProject({ project_path: folderPath });
      } catch (initError) {
        console.warn("Project initialization warning:", initError);
        // Continue even if initialization fails - we can still view files
      }

      setState((prev) => ({
        ...prev,
        projectData,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load project",
      }));
    }
  }, []);

  const handleFileSelect = useCallback((treeNode: ProjectTreeNode) => {
    if (!treeNode.file_info || !treeNode.path) {
      return;
    }

    const vtkData: VtkViewerData = {
      filename: treeNode.file_info.filename,
      file_type: treeNode.file_info.file_type,
      metadata: {
        cell_count: treeNode.file_info.cell_count,
        size_mb: treeNode.file_info.size_mb,
        has_results: treeNode.file_info.has_results,
        has_geometry: treeNode.file_info.has_geometry,
      },
    };

    setState((prev) => ({ ...prev, selectedFile: vtkData }));
  }, []);

  const handleClearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedFile: null }));
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - 30% width */}
      <div className="w-[30%] bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-card-foreground">
              <span className="eflow-title">eFlow</span> Viewer
            </h1>

            {/* Botones siempre visibles */}
            <div className="flex items-center space-x-2">
              {/* Home Button */}
              <motion.button
                onClick={onBackToHome}
                className="p-1.5 rounded-lg bg-background border border-border hover:bg-accent transition-colors focus-ring"
                whileTap={{ scale: 0.95 }}
                title="Volver al inicio"
              >
                <Home className="h-4 w-4 text-foreground" />
              </motion.button>

              {/* Theme Toggle Button */}
              <motion.button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-background border border-border hover:bg-accent transition-colors focus-ring"
                whileTap={{ scale: 0.95 }}
                title={
                  theme === "dark"
                    ? "Cambiar a modo claro"
                    : "Cambiar a modo oscuro"
                }
              >
                <motion.div
                  initial={false}
                  animate={{
                    rotate: theme === "dark" ? 0 : 180,
                    scale: theme === "dark" ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="relative"
                >
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-foreground" />
                  ) : (
                    <Sun className="h-4 w-4 text-black dark:text-foreground" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Load Project Button */}
          <Button
            onClick={handleLoadProject}
            disabled={state.loading}
            className="w-full"
            variant="default"
          >
            {state.loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <FolderOpen className="mr-2 h-4 w-4" />
                Load Project
              </>
            )}
          </Button>

          {/* Debug Button */}
          <Button
            onClick={handleDebugRasCommander}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            🔧 Debug ras-commander
          </Button>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Project Sidebar */}
        <div className="flex-1 overflow-hidden">
          {state.projectData ? (
            <ProjectSidebar
              projectData={state.projectData}
              onFileSelect={handleFileSelect}
              selectedFile={state.selectedFile}
              onBackToHome={onBackToHome} // Pass down the function
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-card-foreground">No project loaded</p>
                <p className="text-sm mt-1">
                  Click "Load Project" to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Viewer Area - 70% width */}
      <div className="flex-1 flex flex-col">
        <VtkViewer
          data={state.selectedFile}
          onClearSelection={handleClearSelection}
        />
      </div>
    </div>
  );
}
