/**
 * HDF Filter Panel - Component for filtering and searching HDF files
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  FileText,
  Database,
  BarChart3,
  Grid3X3,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/badge";
import { HdfExplorerFileInfo } from "../lib/tauri-commands";

interface HDF_FilterPanelProps {
  files: HdfExplorerFileInfo[];
  filterType: string;
  searchTerm: string;
  onFilterChange: (filterType: string) => void;
  onSearchChange: (searchTerm: string) => void;
}

export function HDF_FilterPanel({
  files,
  filterType,
  searchTerm,
  onFilterChange,
  onSearchChange,
}: HDF_FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate file type counts
  const fileCounts = useMemo(() => {
    const counts = {
      all: files.length,
      plans: 0,
      geometries: 0,
      results: 0,
      other: 0,
    };

    files.forEach((file) => {
      const fileName = file.name.toLowerCase();
      if (fileName.startsWith("p") && fileName.endsWith(".hdf")) {
        counts.plans++;
      } else if (fileName.includes("geom") || fileName.includes("geometry")) {
        counts.geometries++;
      } else if (fileName.includes("result") || fileName.includes("output")) {
        counts.results++;
      } else {
        counts.other++;
      }
    });

    return counts;
  }, [files]);

  // Filter options
  const filterOptions = [
    {
      key: "all",
      label: "Todos",
      icon: <FileText className="h-4 w-4" />,
      count: fileCounts.all,
    },
    {
      key: "plans",
      label: "Planes",
      icon: <Database className="h-4 w-4" />,
      count: fileCounts.plans,
    },
    {
      key: "geometries",
      label: "Geometrías",
      icon: <Grid3X3 className="h-4 w-4" />,
      count: fileCounts.geometries,
    },
    {
      key: "results",
      label: "Resultados",
      icon: <BarChart3 className="h-4 w-4" />,
      count: fileCounts.results,
    },
    {
      key: "other",
      label: "Otros",
      icon: <FileText className="h-4 w-4" />,
      count: fileCounts.other,
    },
  ];

  const handleClearSearch = () => {
    onSearchChange("");
  };

  const handleClearFilters = () => {
    onFilterChange("all");
    onSearchChange("");
  };

  const hasActiveFilters = filterType !== "all" || searchTerm !== "";

  return (
    <div className="border-b border-border">
      <Card className="rounded-none border-0 border-b">
        <CardContent className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="default" className="ml-2 text-xs">
                  Activo
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Filter Options */}
          {isExpanded && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tipo de archivo
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => onFilterChange(option.key)}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                      filterType === option.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                    <Badge
                      variant={filterType === option.key ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {option.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {filterType !== "all" && (
                  <Badge variant="default" className="text-xs">
                    Tipo: {filterOptions.find(f => f.key === filterType)?.label}
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="default" className="text-xs">
                    Búsqueda: "{searchTerm}"
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* File Count Summary */}
          <div className="text-xs text-muted-foreground">
            {files.length} archivo{files.length !== 1 ? 's' : ''} total
            {hasActiveFilters && (
              <span className="ml-1">
                • Filtros aplicados
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
