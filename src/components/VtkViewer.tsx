/**
 * VTK Viewer - 3D visualization component for HDF data
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Info,
  Download,
  Settings,
  Database,
  FileText,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import { VtkViewerData } from "../types/ras-commander";
import {
  extractHdfData,
  getDetailedHdfStructure,
  VtkDataResponse,
} from "../lib/tauri-commands";
import { HdfDataViewer } from "./HdfDataViewer";
import { RasCommanderDataViewer } from "./RasCommanderDataViewer";

interface VtkViewerProps {
  data: VtkViewerData | null;
  onClearSelection: () => void;
}

interface VtkViewerState {
  loading: boolean;
  error: string | null;
  vtkInitialized: boolean;
  hdfStructure: any | null;
  currentView: "structure" | "vtk" | "ras_commander";
  vtkData: VtkDataResponse | null;
  useRasCommander: boolean;
}

export function VtkViewer({ data, onClearSelection }: VtkViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VtkViewerState>({
    loading: false,
    error: null,
    vtkInitialized: false,
    hdfStructure: null,
    currentView: "ras_commander",
    vtkData: null,
    useRasCommander: true,
  });

  // Initialize VTK when component mounts
  useEffect(() => {
    const initializeVtk = async () => {
      if (!containerRef.current) return;

      try {
        // For now, we'll create a placeholder VTK setup
        // In a real implementation, you would initialize VTK.js here
        setState((prev) => ({ ...prev, vtkInitialized: true }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize VTK viewer",
          vtkInitialized: false,
        }));
      }
    };

    initializeVtk();
  }, []);

  // Load HDF structure when file is selected
  useEffect(() => {
    if (!data) return;

    const loadHdfStructure = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Get detailed HDF structure
        const structureResponse = await getDetailedHdfStructure({
          file_path: data.filename, // This should be the full path
          max_depth: 10,
          include_attributes: true,
        });

        if (!structureResponse.success) {
          throw new Error(
            structureResponse.error || "Failed to load HDF structure"
          );
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          hdfStructure: structureResponse,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load HDF structure",
        }));
      }
    };

    loadHdfStructure();
  }, [data]);

  const handleResetView = useCallback(() => {
    // TODO: Reset VTK camera to default position
    console.log("Reset view");
  }, []);

  const handleZoomIn = useCallback(() => {
    // TODO: Zoom in VTK camera
    console.log("Zoom in");
  }, []);

  const handleZoomOut = useCallback(() => {
    // TODO: Zoom out VTK camera
    console.log("Zoom out");
  }, []);

  const handleVtkVisualize = useCallback((vtkData: VtkDataResponse) => {
    setState((prev) => ({
      ...prev,
      vtkData,
      currentView: "vtk",
    }));
  }, []);

  const handleBackToStructure = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentView: "structure",
    }));
  }, []);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Move3D className="mx-auto h-16 w-16 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2 text-foreground">
            No file selected
          </h3>
          <p>
            Select an HDF file from the project tree to view its 3D
            visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              {data.filename}
            </h2>
            <Badge variant="outline" className="capitalize">
              {data.file_type}
            </Badge>
            {data.metadata.has_results && (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Has Results
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* View Toggle Buttons */}
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              <Button
                variant={
                  state.currentView === "ras_commander" ? "default" : "ghost"
                }
                size="sm"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentView: "ras_commander",
                  }))
                }
                title="RAS Commander View"
              >
                <Database className="h-4 w-4 mr-1" />
                RAS Data
              </Button>
              <Button
                variant={
                  state.currentView === "structure" ? "default" : "ghost"
                }
                size="sm"
                onClick={() =>
                  setState((prev) => ({ ...prev, currentView: "structure" }))
                }
                title="Basic Structure View"
              >
                <FileText className="h-4 w-4 mr-1" />
                Structure
              </Button>
              <Button
                variant={state.currentView === "vtk" ? "default" : "ghost"}
                size="sm"
                onClick={() =>
                  setState((prev) => ({ ...prev, currentView: "vtk" }))
                }
                title="VTK Visualization"
                disabled={!state.vtkData}
              >
                <Move3D className="h-4 w-4 mr-1" />
                3D View
              </Button>
            </div>

            {/* VTK Controls - only show in VTK view */}
            {state.currentView === "vtk" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetView}
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Close Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              title="Close Viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main VTK Viewer Area */}
        <div className="flex-1 relative">
          {state.loading && (
            <div className="absolute inset-0 bg-background/75 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Loading HDF data...
                </p>
              </div>
            </div>
          )}

          {state.error && (
            <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
              <div className="text-center text-destructive">
                <X className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
                <p className="text-sm">{state.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Content based on current view */}
          {state.currentView === "ras_commander" ? (
            <RasCommanderDataViewer
              filePath={data.filename}
              fileName={data.filename}
              onClose={onClearSelection}
            />
          ) : state.currentView === "structure" && state.hdfStructure ? (
            <HdfDataViewer
              filePath={data.filename}
              structureData={state.hdfStructure}
              onVtkVisualize={handleVtkVisualize}
            />
          ) : state.currentView === "vtk" && state.vtkData ? (
            /* VTK Container */
            <div
              ref={containerRef}
              className="w-full h-full bg-muted dark:bg-muted/20"
              style={{ minHeight: "400px" }}
            >
              {/* VTK Visualization */}
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Move3D className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">
                    VTK Visualization
                  </h3>
                  <p className="text-sm opacity-75">
                    3D visualization of {state.vtkData.visualization_type} data
                  </p>
                  <p className="text-xs opacity-50 mt-2">
                    File: {data.filename} ({data.metadata.size_mb.toFixed(1)}{" "}
                    MB)
                  </p>
                  {data.metadata.cell_count && (
                    <p className="text-xs opacity-50">
                      Cells: {data.metadata.cell_count.toLocaleString()}
                    </p>
                  )}
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>VTK rendering will be implemented here</p>
                    <p>
                      Datasets: {state.vtkData.vtk_data?.datasets?.length || 0}
                    </p>
                    <p>Has mesh: {state.vtkData.mesh_info ? "Yes" : "No"}</p>
                    <p>
                      Has results: {state.vtkData.result_info ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Default state */
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Database className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  HDF File Viewer
                </h3>
                <p className="text-sm opacity-75">Loading file structure...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Panel */}
        <div className="w-80 bg-card border-l border-border p-4 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-4 w-4" />
                <span>File Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Filename
                </label>
                <p className="text-sm text-card-foreground break-all">
                  {data.filename}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Type
                </label>
                <p className="text-sm text-card-foreground capitalize">
                  {data.file_type}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Size
                </label>
                <p className="text-sm text-gray-900">
                  {data.metadata.size_mb.toFixed(2)} MB
                </p>
              </div>

              {data.metadata.cell_count && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Cell Count
                  </label>
                  <p className="text-sm text-gray-900">
                    {data.metadata.cell_count.toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Features
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.metadata.has_geometry && (
                    <Badge variant="secondary" className="text-xs">
                      Geometry
                    </Badge>
                  )}
                  {data.metadata.has_results && (
                    <Badge variant="secondary" className="text-xs">
                      Results
                    </Badge>
                  )}
                </div>
              </div>

              {/* Placeholder for additional controls */}
              <div className="pt-4 border-t border-gray-200">
                <Button variant="outline" size="sm" className="w-full mb-2">
                  <Settings className="h-4 w-4 mr-2" />
                  View Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
