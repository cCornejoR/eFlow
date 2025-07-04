/**
 * HDF Explorer - Main component for comprehensive HDF5 file exploration
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  FolderOpen,
  Database,
  Search,
  Filter,
  FileText,
  BarChart3,
  Grid3X3,
  Loader2,
  AlertCircle,
  Home,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Alert, AlertDescription } from "./ui/Alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useTheme } from "../contexts/ThemeContext";
import { HDF_FileList } from "./HDF_FileList";
import { HDF_StructureTree } from "./HDF_StructureTree";
import { HDF_DatasetTable } from "./HDF_DatasetTable";
import { HDF_FilterPanel } from "./HDF_FilterPanel";
import { HDF_DetailView } from "./HDF_DetailView";
import {
  findHdfFiles,
  analyzeHdfFile,
  HdfExplorerFileInfo,
  HdfExplorerAnalysisResponse,
} from "../lib/tauri-commands";
import { selectProjectFolder } from "../lib/tauri-commands";

interface HdfExplorerState {
  projectPath: string | null;
  files: HdfExplorerFileInfo[];
  selectedFile: HdfExplorerFileInfo | null;
  analysisData: HdfExplorerAnalysisResponse | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
  filterType: string;
  searchTerm: string;
}

interface HdfExplorerProps {
  onBackToHome: () => void;
}

export function HDF_Explorer({ onBackToHome }: HdfExplorerProps) {
  const { theme, toggleTheme } = useTheme();
  const [state, setState] = useState<HdfExplorerState>({
    projectPath: null,
    files: [],
    selectedFile: null,
    analysisData: null,
    loading: false,
    error: null,
    activeTab: "files",
    filterType: "all",
    searchTerm: "",
  });

  // Handle project folder selection
  const handleSelectFolder = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      
      const folderPath = await selectProjectFolder();
      if (!folderPath) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const response = await findHdfFiles(folderPath);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to find HDF files");
      }

      setState((prev) => ({
        ...prev,
        projectPath: folderPath,
        files: response.files,
        loading: false,
        selectedFile: null,
        analysisData: null,
        activeTab: "files",
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to select folder",
      }));
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: HdfExplorerFileInfo) => {
    try {
      setState((prev) => ({ 
        ...prev, 
        loading: true, 
        error: null, 
        selectedFile: file,
        activeTab: "analysis"
      }));

      const response = await analyzeHdfFile(file.path);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to analyze file");
      }

      setState((prev) => ({
        ...prev,
        analysisData: response,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to analyze file",
      }));
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!state.projectPath) return;
    
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      
      const response = await findHdfFiles(state.projectPath);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to refresh files");
      }

      setState((prev) => ({
        ...prev,
        files: response.files,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to refresh",
      }));
    }
  }, [state.projectPath]);

  // Handle filter change
  const handleFilterChange = useCallback((filterType: string) => {
    setState((prev) => ({ ...prev, filterType }));
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((searchTerm: string) => {
    setState((prev) => ({ ...prev, searchTerm }));
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - 30% width */}
      <div className="w-[30%] bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-card-foreground">
              <span className="eflow-title">HDF</span> Explorer
            </h1>

            {/* Header buttons */}
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

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-background border border-border hover:bg-accent transition-colors focus-ring"
                whileTap={{ scale: 0.95 }}
                title={`Cambiar a tema ${theme === "light" ? "oscuro" : "claro"}`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 text-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-foreground" />
                )}
              </motion.button>

              {/* Refresh Button */}
              {state.projectPath && (
                <motion.button
                  onClick={handleRefresh}
                  disabled={state.loading}
                  className="p-1.5 rounded-lg bg-background border border-border hover:bg-accent transition-colors focus-ring disabled:opacity-50"
                  whileTap={{ scale: 0.95 }}
                  title="Actualizar archivos"
                >
                  <RefreshCw className={`h-4 w-4 text-foreground ${state.loading ? 'animate-spin' : ''}`} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Project selection */}
          {!state.projectPath ? (
            <Button
              onClick={handleSelectFolder}
              disabled={state.loading}
              className="w-full"
              size="lg"
            >
              {state.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando archivos...
                </>
              ) : (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Seleccionar Proyecto
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Proyecto:</div>
              <div className="text-sm font-medium truncate" title={state.projectPath}>
                {state.projectPath.split(/[/\\]/).pop()}
              </div>
              <div className="text-xs text-muted-foreground">
                {state.files.length} archivo{state.files.length !== 1 ? 's' : ''} HDF encontrado{state.files.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {state.error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Filter Panel */}
        {state.projectPath && state.files.length > 0 && (
          <HDF_FilterPanel
            files={state.files}
            filterType={state.filterType}
            searchTerm={state.searchTerm}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />
        )}

        {/* File List */}
        {state.projectPath && (
          <div className="flex-1 overflow-hidden">
            <HDF_FileList
              files={state.files}
              selectedFile={state.selectedFile}
              filterType={state.filterType}
              searchTerm={state.searchTerm}
              loading={state.loading}
              onFileSelect={handleFileSelect}
            />
          </div>
        )}
      </div>

      {/* Main Content Area - 70% width */}
      <div className="flex-1 flex flex-col">
        {state.selectedFile && state.analysisData ? (
          <Tabs value={state.activeTab} onValueChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}>
            <div className="border-b border-border p-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Análisis
                </TabsTrigger>
                <TabsTrigger value="structure">
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Estructura
                </TabsTrigger>
                <TabsTrigger value="datasets">
                  <Database className="mr-2 h-4 w-4" />
                  Datasets
                </TabsTrigger>
                <TabsTrigger value="details">
                  <FileText className="mr-2 h-4 w-4" />
                  Detalles
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="analysis" className="h-full">
                <HDF_DetailView 
                  analysisData={state.analysisData}
                  loading={state.loading}
                />
              </TabsContent>
              
              <TabsContent value="structure" className="h-full">
                <HDF_StructureTree 
                  filePath={state.selectedFile.path}
                  structureData={state.analysisData.structure}
                />
              </TabsContent>
              
              <TabsContent value="datasets" className="h-full">
                <HDF_DatasetTable 
                  datasets={state.analysisData.top_datasets}
                  filePath={state.selectedFile.path}
                />
              </TabsContent>
              
              <TabsContent value="details" className="h-full">
                <HDF_DetailView 
                  analysisData={state.analysisData}
                  loading={state.loading}
                  showFullDetails={true}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Database className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {!state.projectPath 
                  ? "Selecciona un proyecto para comenzar"
                  : "Selecciona un archivo HDF para analizar"
                }
              </h3>
              <p className="text-sm">
                {!state.projectPath 
                  ? "Elige una carpeta que contenga archivos HDF5 de HEC-RAS"
                  : "Haz clic en un archivo de la lista para ver su contenido"
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
