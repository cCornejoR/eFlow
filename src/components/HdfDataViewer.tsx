/**
 * HDF Data Viewer - Comprehensive viewer for HDF file contents
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Database,
  Grid3X3,
  Info,
  Download,
  Eye,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { TreeView, TreeNode } from "./ui/tree";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import {
  HdfDetailedNode,
  HdfDetailedStructureResponse,
  HdfDatasetResponse,
  VtkDataResponse,
  extractHdfDataset,
  prepareVtkData,
} from "../lib/tauri-commands";

interface HdfDataViewerProps {
  filePath: string;
  structureData: HdfDetailedStructureResponse;
  onVtkVisualize?: (vtkData: VtkDataResponse) => void;
}

interface ViewerState {
  selectedDataset: string | null;
  datasetData: HdfDatasetResponse | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
}

export function HdfDataViewer({
  filePath,
  structureData,
  onVtkVisualize,
}: HdfDataViewerProps) {
  const [state, setState] = useState<ViewerState>({
    selectedDataset: null,
    datasetData: null,
    loading: false,
    error: null,
    activeTab: "structure",
  });

  // Convert HDF structure to tree nodes
  const convertToTreeNodes = useCallback((node: HdfDetailedNode): TreeNode => {
    const isDataset = node.type === "dataset";
    const hasData = isDataset && node.shape && node.shape.length > 0;

    let label = node.name;
    if (isDataset && node.shape) {
      const shapeStr = node.shape.join(" × ");
      label += ` [${shapeStr}]`;
      if (node.dtype) {
        label += ` (${node.dtype})`;
      }
    }

    return {
      id: node.path,
      label,
      icon: isDataset ? (
        hasData ? (
          <Database className="h-4 w-4 text-blue-500" />
        ) : (
          <FileText className="h-4 w-4 text-gray-500" />
        )
      ) : (
        <Grid3X3 className="h-4 w-4 text-green-500" />
      ),
      children: node.children?.map(convertToTreeNodes),
      data: {
        ...node,
        isDataset,
        hasData,
      },
    };
  }, []);

  const treeData = structureData.root_node
    ? [convertToTreeNodes(structureData.root_node)]
    : [];

  // Handle dataset selection
  const handleDatasetSelect = useCallback(
    async (node: TreeNode) => {
      if (!node.data?.isDataset || !node.data?.hasData) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await extractHdfDataset({
          file_path: filePath,
          dataset_path: node.data.path,
          max_rows: 1000,
          include_attributes: true,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to extract dataset");
        }

        setState((prev) => ({
          ...prev,
          selectedDataset: node.data.path,
          datasetData: response,
          loading: false,
          activeTab: "data",
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to load dataset",
        }));
      }
    },
    [filePath]
  );

  // Handle VTK visualization
  const handleVtkVisualize = useCallback(async () => {
    if (!state.selectedDataset) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await prepareVtkData({
        file_path: filePath,
        dataset_paths: [state.selectedDataset],
        result_type: "auto",
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to prepare VTK data");
      }

      onVtkVisualize?.(response);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to prepare VTK data",
      }));
    }
  }, [filePath, state.selectedDataset, onVtkVisualize]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">
              {structureData.filename}
            </h3>
            <p className="text-sm text-muted-foreground">
              {structureData.total_groups} groups,{" "}
              {structureData.total_datasets} datasets
            </p>
          </div>
        </div>

        {state.selectedDataset && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVtkVisualize}
              disabled={state.loading}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Visualize
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={state.activeTab}
          onValueChange={(value) =>
            setState((prev) => ({ ...prev, activeTab: value }))
          }
        >
          <TabsList className="w-full">
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="data" disabled={!state.datasetData}>
              Data {state.datasetData && `(${state.datasetData.dataset_path})`}
            </TabsTrigger>
            <TabsTrigger value="attributes" disabled={!state.datasetData}>
              Attributes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="flex-1 overflow-hidden">
            <div className="h-full p-4">
              <TreeView
                data={treeData}
                onNodeClick={handleDatasetSelect}
                className="h-full border-0"
                showLines={true}
                showIcons={true}
                selectable={true}
                selectedIds={
                  state.selectedDataset ? [state.selectedDataset] : []
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="data" className="flex-1 overflow-hidden">
            <div className="h-full p-4">
              {state.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Loading dataset...
                    </p>
                  </div>
                </div>
              ) : state.datasetData ? (
                <DatasetTable data={state.datasetData} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Table className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a dataset to view its data</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="flex-1 overflow-hidden">
            <div className="h-full p-4">
              {state.datasetData ? (
                <AttributesPanel attributes={state.datasetData.attributes} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Info className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a dataset to view its attributes</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="p-4 border-t border-border">
          <div className="flex items-start space-x-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Dataset Table Component
interface DatasetTableProps {
  data: HdfDatasetResponse;
}

function DatasetTable({ data }: DatasetTableProps) {
  if (!data.data || !data.columns) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No data available for this dataset</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dataset Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {data.shape?.join(" × ")} {data.dtype}
          </Badge>
          {data.is_truncated && (
            <Badge variant="secondary">
              Showing {data.data.length} of {data.total_rows} rows
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map((column, index) => (
                <TableHead key={index}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {typeof cell === "number" ? cell.toFixed(6) : String(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Attributes Panel Component
interface AttributesPanelProps {
  attributes: Record<string, any>;
}

function AttributesPanel({ attributes }: AttributesPanelProps) {
  const attributeEntries = Object.entries(attributes);

  if (attributeEntries.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No attributes available for this dataset</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attributeEntries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-start space-x-3 p-3 border rounded-lg"
        >
          <div className="font-medium text-sm min-w-0 flex-1">{key}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
