/**
 * HDF Analysis Page - Página independiente para análisis de archivos HDF5
 */

import React, { useState, useCallback } from "react";
import {
  ArrowLeft,
  FolderOpen,
  Database,
  FileText,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Alert, AlertDescription } from "../components/ui/Alert";
import { useTheme } from "../contexts/ThemeContext";
import {
  findHdf5Files,
  analyzeHdf5Info,
  analyzeHdf5Structure,
  extractHecRasData,
  listHdf5Datasets,
  readHdf5DatasetSample,
  selectProjectFolder,
  RustFileInfo,
  RustFileStructure,
  RustHecRasData,
} from "../lib/tauri-commands";

interface HdfAnalysisState {
  projectPath: string | null;
  files: RustFileInfo[];
  selectedFile: RustFileInfo | null;
  analysisData: {
    fileInfo: RustFileInfo;
    structure: RustFileStructure;
    hecrasData: RustHecRasData;
    datasets: string[];
  } | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterType: string;
}

interface HdfAnalysisPageProps {
  onBackToHome: () => void;
}

export function HdfAnalysisPage({ onBackToHome }: HdfAnalysisPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [state, setState] = useState<HdfAnalysisState>({
    projectPath: null,
    files: [],
    selectedFile: null,
    analysisData: null,
    loading: false,
    error: null,
    searchTerm: "",
    filterType: "all",
  });

  // Seleccionar carpeta del proyecto
  const handleSelectFolder = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const folderPath = await selectProjectFolder();
      if (!folderPath) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      console.log("🔍 Buscando archivos HDF en:", folderPath);
      const files = await findHdf5Files(folderPath);

      console.log("✅ Archivos encontrados:", files.length);
      setState((prev) => ({
        ...prev,
        projectPath: folderPath,
        files: files,
        loading: false,
        selectedFile: null,
        analysisData: null,
      }));
    } catch (error) {
      console.error("❌ Error al seleccionar carpeta:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al seleccionar carpeta",
      }));
    }
  }, []);

  // Analizar archivo seleccionado
  const handleAnalyzeFile = useCallback(async (file: RustFileInfo) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        selectedFile: file,
      }));

      console.log("🔍 Analizando archivo:", file.path);

      // Ejecutar múltiples análisis en paralelo
      const [fileInfo, structure, hecrasData, datasets] = await Promise.all([
        analyzeHdf5Info(file.path),
        analyzeHdf5Structure(file.path),
        extractHecRasData(file.path),
        listHdf5Datasets(file.path),
      ]);

      console.log("✅ Análisis completado");
      setState((prev) => ({
        ...prev,
        analysisData: {
          fileInfo,
          structure,
          hecrasData,
          datasets,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("❌ Error al analizar archivo:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Error al analizar archivo",
      }));
    }
  }, []);

  // Filtrar archivos
  const filteredFiles = state.files.filter((file) => {
    const matchesSearch =
      state.searchTerm === "" ||
      file.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(state.searchTerm.toLowerCase());

    const matchesFilter =
      state.filterType === "all" ||
      (state.filterType === "plans" &&
        file.name.toLowerCase().startsWith("p")) ||
      (state.filterType === "geometries" &&
        (file.name.toLowerCase().includes("geom") ||
          file.name.toLowerCase().includes("geometry"))) ||
      (state.filterType === "results" &&
        (file.name.toLowerCase().includes("result") ||
          file.name.toLowerCase().includes("output")));

    return matchesSearch && matchesFilter;
  });

  // Formatear tamaño de archivo
  const formatFileSize = (sizeMb: number): string => {
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(0)} KB`;
    if (sizeMb < 1024) return `${sizeMb.toFixed(2)} MB`;
    return `${(sizeMb / 1024).toFixed(2)} GB`;
  };

  // Formatear fecha
  const formatDate = (dateString: string | Date): string => {
    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToHome}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  <span className="eflow-title">HDF5</span> Analysis
                </h1>
                <p className="text-sm text-muted-foreground">
                  Explorador visual de archivos HEC-RAS HDF5
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                title={`Cambiar a tema ${
                  theme === "light" ? "oscuro" : "claro"
                }`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - File Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="mr-2 h-5 w-5" />
                  Selección de Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Test with Fixed Path Button */}
                <Button
                  onClick={async () => {
                    try {
                      setState((prev) => ({
                        ...prev,
                        loading: true,
                        error: null,
                      }));

                      // Use a test path - you can change this to a real path on your system
                      const testPath = "D:\\HYDRA21_APP\\eFlow\\Explorer";
                      console.log("🔍 Testing with path:", testPath);

                      const files = await findHdf5Files(testPath);
                      console.log("📊 Files found:", files);

                      setState((prev) => ({
                        ...prev,
                        projectPath: testPath,
                        files: files,
                        loading: false,
                      }));
                      alert(`✅ Encontrados ${files.length} archivos HDF`);
                    } catch (error) {
                      setState((prev) => ({
                        ...prev,
                        loading: false,
                        error: String(error),
                      }));
                      alert(`❌ Error: ${error}`);
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={state.loading}
                >
                  {state.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    "🧪 Probar con Ruta Fija"
                  )}
                </Button>

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
                        Buscando...
                      </>
                    ) : (
                      <>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Seleccionar Carpeta
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Proyecto:
                      </div>
                      <div
                        className="text-sm bg-muted/50 p-2 rounded truncate"
                        title={state.projectPath}
                      >
                        {state.projectPath.split(/[/\\]/).pop()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {state.files.length} archivo
                      {state.files.length !== 1 ? "s" : ""} HDF encontrado
                      {state.files.length !== 1 ? "s" : ""}
                    </div>
                    <Button
                      onClick={handleSelectFolder}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Cambiar Carpeta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File List */}
            {state.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5" />
                    Archivos HDF ({filteredFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar archivos..."
                        value={state.searchTerm}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            searchTerm: e.target.value,
                          }))
                        }
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <select
                      value={state.filterType}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          filterType: e.target.value,
                        }))
                      }
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Todos los archivos</option>
                      <option value="plans">Planes (p*.hdf)</option>
                      <option value="geometries">Geometrías</option>
                      <option value="results">Resultados</option>
                    </select>
                  </div>

                  {/* File List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredFiles.map((file) => (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          state.selectedFile?.path === file.path
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                        onClick={() => handleAnalyzeFile(file)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div
                              className="font-medium text-sm truncate"
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            {file.accessible ? (
                              <Database className="h-4 w-4 text-blue-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Tamaño: {formatFileSize(file.size_mb)}</div>
                            <div>Modificado: {formatDate(file.modified)}</div>
                            <div>
                              {file.groups_count} grupos • {file.datasets_count}{" "}
                              datasets
                            </div>
                            {file.error && (
                              <div className="text-destructive">
                                Error: {file.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="lg:col-span-2">
            {state.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state.loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">
                      {state.selectedFile
                        ? "Analizando archivo..."
                        : "Buscando archivos..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : state.analysisData && state.selectedFile ? (
              <div className="space-y-6">
                {/* File Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Información del Archivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <strong>Nombre:</strong>{" "}
                          {state.analysisData.fileInfo.name}
                        </div>
                        <div>
                          <strong>Tamaño:</strong>{" "}
                          {formatFileSize(state.analysisData.fileInfo.size_mb)}
                        </div>
                        <div>
                          <strong>Grupos:</strong>{" "}
                          {state.analysisData.fileInfo.groups_count}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <strong>Datasets:</strong>{" "}
                          {state.analysisData.fileInfo.datasets_count}
                        </div>
                        <div>
                          <strong>Modificado:</strong>{" "}
                          {formatDate(state.analysisData.fileInfo.modified)}
                        </div>
                        <div>
                          <strong>Accesible:</strong>{" "}
                          {state.analysisData.fileInfo.accessible ? "Sí" : "No"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Structure Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Estructura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {state.analysisData.structure.total_groups}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Grupos
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {state.analysisData.structure.total_datasets}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Datasets
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {state.analysisData.datasets.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Datasets Listados
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* HEC-RAS Metadata */}
                {Object.keys(state.analysisData.hecrasData.metadata).length >
                  0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Metadatos HEC-RAS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(
                          state.analysisData.hecrasData.metadata
                        ).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </div>
                            <div className="text-sm bg-muted/50 p-2 rounded">
                              {String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Datasets List */}
                {state.analysisData.datasets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Lista de Datasets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {state.analysisData.datasets
                          .slice(0, 20)
                          .map((datasetPath, index) => (
                            <div
                              key={datasetPath}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="font-medium text-sm">
                                  {datasetPath.split("/").pop() || "Dataset"}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {datasetPath}
                                </div>
                                <div className="text-xs">
                                  <span className="bg-primary/10 text-primary px-2 py-1 rounded mr-2">
                                    Dataset #{index + 1}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const sample =
                                        await readHdf5DatasetSample(
                                          state.selectedFile!.path,
                                          datasetPath,
                                          5
                                        );
                                      alert(
                                        `Muestra de datos: ${sample.join(", ")}`
                                      );
                                    } catch (error) {
                                      alert(`Error: ${error}`);
                                    }
                                  }}
                                >
                                  Ver Muestra
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* HEC-RAS Data Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Datos HEC-RAS Extraídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Datos de Geometría</h4>
                        <div className="space-y-2">
                          {Object.entries(
                            state.analysisData.hecrasData.geometry_data
                          ).map(([key, values]) => (
                            <div key={key} className="text-sm">
                              <div className="font-medium">
                                {key.split("/").pop()}
                              </div>
                              <div className="text-muted-foreground">
                                {values.length} valores - Muestra:{" "}
                                {values.slice(0, 3).join(", ")}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">
                          Datos de Resultados
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(
                            state.analysisData.hecrasData.results_data
                          ).map(([key, values]) => (
                            <div key={key} className="text-sm">
                              <div className="font-medium">
                                {key.split("/").pop()}
                              </div>
                              <div className="text-muted-foreground">
                                {values.length} valores - Muestra:{" "}
                                {values.slice(0, 3).join(", ")}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <Database className="mx-auto h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {!state.projectPath
                        ? "Selecciona un proyecto para comenzar"
                        : "Selecciona un archivo HDF para analizar"}
                    </h3>
                    <p className="text-sm">
                      {!state.projectPath
                        ? "Elige una carpeta que contenga archivos HDF5 de HEC-RAS"
                        : "Haz clic en un archivo de la lista para ver su análisis completo"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
