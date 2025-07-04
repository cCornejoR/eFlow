/**
 * HDF Detail View - Component for displaying detailed analysis of HDF files
 */

import React from "react";
import {
  FileText,
  Database,
  BarChart3,
  Grid3X3,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import { HdfExplorerAnalysisResponse } from "../lib/tauri-commands";

interface HDF_DetailViewProps {
  analysisData: HdfExplorerAnalysisResponse;
  loading: boolean;
  showFullDetails?: boolean;
}

export function HDF_DetailView({ 
  analysisData, 
  loading, 
  showFullDetails = false 
}: HDF_DetailViewProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analizando archivo...</p>
        </div>
      </div>
    );
  }

  if (!analysisData.success) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <XCircle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="font-medium mb-2">Error en el análisis</h3>
          <p className="text-sm">{analysisData.error}</p>
        </div>
      </div>
    );
  }

  const { file_info, structure, hecras_data } = analysisData;

  // Format file size
  const formatFileSize = (sizeMb: number): string => {
    if (sizeMb < 1) {
      return `${(sizeMb * 1024).toFixed(0)} KB`;
    } else if (sizeMb < 1024) {
      return `${sizeMb.toFixed(2)} MB`;
    } else {
      return `${(sizeMb / 1024).toFixed(2)} GB`;
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* File Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Información del Archivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nombre</div>
                  <div className="text-sm">{file_info.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Ruta</div>
                  <div className="text-xs font-mono bg-muted/50 p-2 rounded truncate" title={file_info.path}>
                    {file_info.path}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Estado</div>
                  <div className="flex items-center space-x-2">
                    {file_info.accessible ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      {file_info.accessible ? "Accesible" : "No accesible"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tamaño</div>
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatFileSize(file_info.size_mb)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Modificado</div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(file_info.modified)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Contenido</div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Grid3X3 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{file_info.groups} grupos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Database className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{file_info.datasets} datasets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Structure Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="mr-2 h-5 w-5" />
              Resumen de Estructura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Grid3X3 className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <div className="text-2xl font-bold">{structure.total_groups}</div>
                <div className="text-sm text-muted-foreground">Grupos</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Database className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{structure.total_datasets}</div>
                <div className="text-sm text-muted-foreground">Datasets</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <BarChart3 className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                <div className="text-2xl font-bold">{analysisData.top_datasets.length}</div>
                <div className="text-sm text-muted-foreground">Top Datasets</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Info className="mx-auto h-8 w-8 text-orange-500 mb-2" />
                <div className="text-2xl font-bold">
                  {Object.keys(hecras_data.metadata).length}
                </div>
                <div className="text-sm text-muted-foreground">Metadatos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* HEC-RAS Metadata */}
      {Object.keys(hecras_data.metadata).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Metadatos HEC-RAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(hecras_data.metadata).map(([key, value]) => (
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
        </motion.div>
      )}

      {/* Extraction Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Resumen de Extracción HEC-RAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(hecras_data.extraction_summary).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="text-sm capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                  <Badge
                    variant={status === "Found" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {status === "Found" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Datasets */}
      {analysisData.top_datasets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Datasets Principales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.top_datasets.slice(0, showFullDetails ? undefined : 5).map((dataset, index) => (
                  <div
                    key={dataset.path}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-medium text-sm">{dataset.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {dataset.path}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {dataset.shape.join(" × ")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {dataset.dtype}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatFileSize(dataset.size_mb)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!showFullDetails && analysisData.top_datasets.length > 5 && (
                <div className="text-center pt-3 text-sm text-muted-foreground">
                  ... y {analysisData.top_datasets.length - 5} datasets más
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Full Details Section */}
      {showFullDetails && Object.keys(hecras_data.extracted_data).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Grid3X3 className="mr-2 h-5 w-5" />
                Datos Extraídos por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(hecras_data.extracted_data).map(([category, datasets]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-sm capitalize border-b border-border pb-2">
                      {category.replace(/_/g, " ")}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(datasets as Record<string, any>).map(([name, data]) => (
                        <div key={name} className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{name}</div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {data.shape?.join(" × ") || "N/A"}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {data.dtype || "N/A"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div>Ruta: {data.path}</div>
                            <div>Tamaño: {data.size?.toLocaleString() || "N/A"} elementos</div>
                            {data.sample_preview && data.sample_preview.length > 0 && (
                              <div className="mt-2">
                                <div className="font-medium">Vista previa:</div>
                                <div className="bg-background p-2 rounded mt-1 font-mono text-xs">
                                  {JSON.stringify(data.sample_preview, null, 2)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
