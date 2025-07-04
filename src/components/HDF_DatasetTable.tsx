/**
 * HDF Dataset Table - Component for displaying dataset information in tabular format
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Database,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { extractDatasetSample, HdfExplorerDataSampleResponse } from "../lib/tauri-commands";

interface Dataset {
  name: string;
  path: string;
  shape: number[];
  dtype: string;
  size_mb: number;
}

interface HDF_DatasetTableProps {
  datasets: Dataset[];
  filePath: string;
}

interface TableState {
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: keyof Dataset | null;
  sortDirection: "asc" | "desc";
  selectedDataset: Dataset | null;
  sampleData: HdfExplorerDataSampleResponse | null;
  loadingSample: boolean;
}

export function HDF_DatasetTable({ datasets, filePath }: HDF_DatasetTableProps) {
  const [state, setState] = useState<TableState>({
    currentPage: 1,
    pageSize: 25,
    searchTerm: "",
    sortColumn: null,
    sortDirection: "asc",
    selectedDataset: null,
    sampleData: null,
    loadingSample: false,
  });

  // Filter and sort datasets
  const processedDatasets = useMemo(() => {
    let filtered = [...datasets];

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (dataset) =>
          dataset.name.toLowerCase().includes(searchLower) ||
          dataset.path.toLowerCase().includes(searchLower) ||
          dataset.dtype.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (state.sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a[state.sortColumn!];
        let bVal = b[state.sortColumn!];

        // Handle array values (shape)
        if (Array.isArray(aVal)) aVal = aVal.join(",");
        if (Array.isArray(bVal)) bVal = bVal.join(",");

        // Convert to string for comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (state.sortDirection === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [datasets, state.searchTerm, state.sortColumn, state.sortDirection]);

  // Paginate datasets
  const paginatedDatasets = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return processedDatasets.slice(startIndex, endIndex);
  }, [processedDatasets, state.currentPage, state.pageSize]);

  const totalPages = Math.ceil(processedDatasets.length / state.pageSize);

  // Handle sorting
  const handleSort = useCallback((column: keyof Dataset) => {
    setState((prev) => ({
      ...prev,
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === "asc" ? "desc" : "asc",
      currentPage: 1,
    }));
  }, []);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setState((prev) => ({
      ...prev,
      searchTerm,
      currentPage: 1,
    }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Handle dataset preview
  const handlePreview = useCallback(async (dataset: Dataset) => {
    try {
      setState((prev) => ({
        ...prev,
        selectedDataset: dataset,
        loadingSample: true,
        sampleData: null,
      }));

      const response = await extractDatasetSample(filePath, dataset.path, 100);
      
      setState((prev) => ({
        ...prev,
        sampleData: response,
        loadingSample: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingSample: false,
        sampleData: {
          success: false,
          error: error instanceof Error ? error.message : "Failed to load sample",
          data: [],
          metadata: {
            path: dataset.path,
            shape: dataset.shape,
            dtype: dataset.dtype,
            size: 0,
            attributes: {},
          },
        },
      }));
    }
  }, [filePath]);

  // Format file size
  const formatSize = (sizeMb: number): string => {
    if (sizeMb < 1) {
      return `${(sizeMb * 1024).toFixed(0)} KB`;
    } else if (sizeMb < 1024) {
      return `${sizeMb.toFixed(2)} MB`;
    } else {
      return `${(sizeMb / 1024).toFixed(2)} GB`;
    }
  };

  // Format shape
  const formatShape = (shape: number[]): string => {
    return shape.join(" × ");
  };

  // Render sort icon
  const renderSortIcon = (column: keyof Dataset) => {
    if (state.sortColumn !== column) {
      return <MoreHorizontal className="h-4 w-4 opacity-50" />;
    }
    return state.sortDirection === "asc" ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Datasets ({processedDatasets.length})
            </CardTitle>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar datasets..."
              value={state.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {paginatedDatasets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Nombre</span>
                      {renderSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("shape")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Forma</span>
                      {renderSortIcon("shape")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("dtype")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Tipo</span>
                      {renderSortIcon("dtype")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("size_mb")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Tamaño</span>
                      {renderSortIcon("size_mb")}
                    </div>
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDatasets.map((dataset, index) => (
                  <motion.tr
                    key={dataset.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-accent/50"
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{dataset.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs" title={dataset.path}>
                          {dataset.path}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatShape(dataset.shape)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {dataset.dtype}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatSize(dataset.size_mb)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(dataset)}
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Exportar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Database className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">
                  {state.searchTerm ? "No se encontraron datasets" : "No hay datasets para mostrar"}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(state.currentPage - 1) * state.pageSize + 1} a{" "}
                {Math.min(state.currentPage * state.pageSize, processedDatasets.length)} de{" "}
                {processedDatasets.length} datasets
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(state.currentPage - 1)}
                  disabled={state.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {state.currentPage} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(state.currentPage + 1)}
                  disabled={state.currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Sample Data Preview */}
      {state.selectedDataset && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Vista Previa: {state.selectedDataset.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.loadingSample ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Cargando muestra...</p>
                </div>
              </div>
            ) : state.sampleData ? (
              <div className="space-y-4">
                {state.sampleData.success ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Muestra de datos (primeros {state.sampleData.data.length} elementos):
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono max-h-32 overflow-auto">
                      <pre>{JSON.stringify(state.sampleData.data, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-destructive">
                    Error: {state.sampleData.error}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
