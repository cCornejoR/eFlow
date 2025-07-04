/**
 * HDF File List - Component for displaying and filtering HDF files
 */

import React, { useMemo } from "react";
import {
  Database,
  FileText,
  AlertCircle,
  Clock,
  HardDrive,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/badge";
import { HdfExplorerFileInfo } from "../lib/tauri-commands";

interface HDF_FileListProps {
  files: HdfExplorerFileInfo[];
  selectedFile: HdfExplorerFileInfo | null;
  filterType: string;
  searchTerm: string;
  loading: boolean;
  onFileSelect: (file: HdfExplorerFileInfo) => void;
}

export function HDF_FileList({
  files,
  selectedFile,
  filterType,
  searchTerm,
  loading,
  onFileSelect,
}: HDF_FileListProps) {
  // Filter and search files
  const filteredFiles = useMemo(() => {
    let filtered = [...files];

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((file) => {
        const fileName = file.name.toLowerCase();
        switch (filterType) {
          case "plans":
            return fileName.startsWith("p") && fileName.endsWith(".hdf");
          case "geometries":
            return fileName.includes("geom") || fileName.includes("geometry");
          case "results":
            return fileName.includes("result") || fileName.includes("output");
          case "other":
            return !(
              fileName.startsWith("p") ||
              fileName.includes("geom") ||
              fileName.includes("geometry") ||
              fileName.includes("result") ||
              fileName.includes("output")
            );
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchLower) ||
          file.path.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [files, filterType, searchTerm]);

  // Format file size
  const formatFileSize = (sizeMb: number): string => {
    if (sizeMb < 1) {
      return `${(sizeMb * 1024).toFixed(0)} KB`;
    } else if (sizeMb < 1024) {
      return `${sizeMb.toFixed(1)} MB`;
    } else {
      return `${(sizeMb / 1024).toFixed(1)} GB`;
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
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

  // Get file type badge
  const getFileTypeBadge = (fileName: string) => {
    const name = fileName.toLowerCase();
    if (name.startsWith("p") && name.endsWith(".hdf")) {
      return <Badge variant="default">Plan</Badge>;
    } else if (name.includes("geom") || name.includes("geometry")) {
      return <Badge variant="secondary">Geometría</Badge>;
    } else if (name.includes("result") || name.includes("output")) {
      return <Badge variant="outline">Resultados</Badge>;
    } else {
      return <Badge variant="outline">Otro</Badge>;
    }
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Buscando archivos HDF...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="font-medium mb-2">No se encontraron archivos HDF</h3>
          <p className="text-sm">
            La carpeta seleccionada no contiene archivos HDF5
          </p>
        </div>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="font-medium mb-2">No hay archivos que coincidan</h3>
          <p className="text-sm">
            Intenta cambiar los filtros o el término de búsqueda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      {filteredFiles.map((file, index) => (
        <motion.div
          key={file.path}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedFile?.path === file.path
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-accent/50"
            }`}
            onClick={() => onFileSelect(file)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* File header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {file.accessible ? (
                      <Database className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate" title={file.path}>
                        {file.path}
                      </p>
                    </div>
                  </div>
                  {getFileTypeBadge(file.name)}
                </div>

                {/* File stats */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <HardDrive className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatFileSize(file.size_mb)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatDate(file.modified)}
                    </span>
                  </div>
                </div>

                {/* Data counts */}
                {file.accessible && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{file.groups}</span> grupos
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{file.datasets}</span> datasets
                      </span>
                    </div>
                    {selectedFile?.path === file.path && (
                      <Badge variant="default" className="text-xs">
                        Seleccionado
                      </Badge>
                    )}
                  </div>
                )}

                {/* Error indicator */}
                {!file.accessible && (
                  <div className="text-xs text-destructive">
                    ⚠️ Archivo no accesible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Summary */}
      <div className="pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Mostrando {filteredFiles.length} de {files.length} archivo{files.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
