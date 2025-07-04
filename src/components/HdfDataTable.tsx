/**
 * HDF Data Table - Component for displaying tabular HDF data
 */

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import {
  Download,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

interface HdfDataTableProps {
  data: any[][];
  columns: string[];
  title: string;
  metadata?: Record<string, any>;
  maxRows?: number;
  searchable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
}

interface TableState {
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filteredData: any[][];
}

export function HdfDataTable({
  data,
  columns,
  title,
  metadata = {},
  maxRows = 100,
  searchable = true,
  sortable = true,
  exportable = true,
}: HdfDataTableProps) {
  const [state, setState] = useState<TableState>({
    currentPage: 1,
    pageSize: 25,
    searchTerm: "",
    sortColumn: null,
    sortDirection: "asc",
    filteredData: data,
  });

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (state.searchTerm) {
      filtered = filtered.filter((row) =>
        row.some((cell) =>
          String(cell).toLowerCase().includes(state.searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (state.sortColumn !== null) {
      const columnIndex = columns.indexOf(state.sortColumn);
      if (columnIndex !== -1) {
        filtered.sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];
          
          // Handle numeric sorting
          const aNum = Number(aVal);
          const bNum = Number(bVal);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return state.sortDirection === "asc" ? aNum - bNum : bNum - aNum;
          }
          
          // String sorting
          const aStr = String(aVal);
          const bStr = String(bVal);
          if (state.sortDirection === "asc") {
            return aStr.localeCompare(bStr);
          } else {
            return bStr.localeCompare(aStr);
          }
        });
      }
    }

    return filtered;
  }, [data, columns, state.searchTerm, state.sortColumn, state.sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / state.pageSize);
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  const currentPageData = processedData.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (!sortable) return;

    setState((prev) => ({
      ...prev,
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === "asc"
          ? "desc"
          : "asc",
      currentPage: 1,
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setState((prev) => ({
      ...prev,
      searchTerm,
      currentPage: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const handleExport = () => {
    if (!exportable) return;

    // Create CSV content
    const csvContent = [
      columns.join(","),
      ...processedData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") {
      // Format numbers with appropriate precision
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(6).replace(/\.?0+$/, "");
    }
    return String(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge variant="outline">
                {processedData.length} rows
              </Badge>
            </CardTitle>
            {metadata.shape && (
              <p className="text-sm text-muted-foreground mt-1">
                Shape: [{metadata.shape.join(" × ")}]
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Search and Controls */}
        {searchable && (
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search data..."
                className="pl-10 pr-4 py-2 w-full border border-border rounded-md bg-background text-foreground"
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)} of{" "}
              {processedData.length}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead
                      key={index}
                      className={`${
                        sortable ? "cursor-pointer hover:bg-muted/50" : ""
                      } font-medium`}
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column}</span>
                        {sortable && state.sortColumn === column && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {state.sortDirection === "asc" ? (
                              <SortAsc className="h-4 w-4" />
                            ) : (
                              <SortDesc className="h-4 w-4" />
                            )}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.length > 0 ? (
                  currentPageData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="font-mono text-sm">
                          {formatCellValue(cell)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {state.currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.currentPage - 1)}
                disabled={state.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={state.currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant={state.currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.currentPage + 1)}
                disabled={state.currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Data Info */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Dataset Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted-foreground">{key}:</span>{" "}
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
