/**
 * RAS Commander Data Viewer - Advanced HDF data visualization using ras-commander
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  BarChart3,
  Waves,
  Grid3X3,
  FileText,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Table,
  TrendingUp,
  Activity,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  extractComprehensiveHdf,
  extractMeshData,
  extractXsecData,
  extractPlanSummary,
  ComprehensiveHdfResponse,
  MeshDataResponse,
  XsecDataResponse,
  PlanSummaryResponse,
} from "../lib/tauri-commands";

interface RasCommanderDataViewerProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

interface DataViewerState {
  loading: boolean;
  error: string | null;
  comprehensiveData: ComprehensiveHdfResponse | null;
  meshData: MeshDataResponse | null;
  xsecData: XsecDataResponse | null;
  planData: PlanSummaryResponse | null;
  activeTab: string;
  expandedSections: Set<string>;
}

export function RasCommanderDataViewer({
  filePath,
  fileName,
  onClose,
}: RasCommanderDataViewerProps) {
  const [state, setState] = useState<DataViewerState>({
    loading: false,
    error: null,
    comprehensiveData: null,
    meshData: null,
    xsecData: null,
    planData: null,
    activeTab: "overview",
    expandedSections: new Set(["overview"]),
  });

  // Load comprehensive data on mount
  useEffect(() => {
    loadComprehensiveData();
  }, [filePath]);

  const loadComprehensiveData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("🚀 Loading comprehensive HDF data with ras-commander...");
      
      const comprehensiveResult = await extractComprehensiveHdf({
        file_path: filePath,
        data_types: ["all"],
        include_timeseries: true,
        include_maximum_results: true,
      });

      if (!comprehensiveResult.success) {
        throw new Error(comprehensiveResult.error || "Failed to load comprehensive data");
      }

      console.log("✅ Comprehensive data loaded:", comprehensiveResult);

      setState((prev) => ({
        ...prev,
        loading: false,
        comprehensiveData: comprehensiveResult,
      }));

    } catch (error) {
      console.error("❌ Error loading comprehensive data:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      }));
    }
  }, [filePath]);

  const loadSpecificData = useCallback(async (dataType: string) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      switch (dataType) {
        case "mesh":
          const meshResult = await extractMeshData({
            file_path: filePath,
            data_type: "summary",
          });
          setState((prev) => ({ ...prev, meshData: meshResult, loading: false }));
          break;

        case "xsec":
          const xsecResult = await extractXsecData({
            file_path: filePath,
          });
          setState((prev) => ({ ...prev, xsecData: xsecResult, loading: false }));
          break;

        case "plan":
          const planResult = await extractPlanSummary({
            file_path: filePath,
            include_runtime: true,
            include_volume_accounting: true,
          });
          setState((prev) => ({ ...prev, planData: planResult, loading: false }));
          break;

        default:
          setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error(`Error loading ${dataType} data:`, error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `Failed to load ${dataType} data`,
      }));
    }
  }, [filePath]);

  const toggleSection = useCallback((sectionId: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedSections);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return { ...prev, expandedSections: newExpanded };
    });
  }, []);

  const renderDataSection = (title: string, icon: React.ReactNode, data: any, sectionId: string) => {
    const isExpanded = state.expandedSections.has(sectionId);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection(sectionId)}
          >
            <CardTitle className="flex items-center space-x-2 text-lg">
              {icon}
              <span>{title}</span>
              {data && (
                <Badge variant="secondary" className="ml-2">
                  Available
                </Badge>
              )}
            </CardTitle>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
                {data ? (
                  <div className="space-y-4">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSpecificData(sectionId)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-4">{icon}</div>
                    <p className="mb-4">No {title.toLowerCase()} data available</p>
                    <Button
                      variant="outline"
                      onClick={() => loadSpecificData(sectionId)}
                      disabled={state.loading}
                    >
                      {state.loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      Load {title}
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  const renderOverview = () => {
    const data = state.comprehensiveData;
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>File Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  File Name
                </label>
                <p className="text-sm">{data.filename}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  File Path
                </label>
                <p className="text-sm font-mono break-all">{data.file_path}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data Type
                </label>
                <p className="text-sm capitalize">{data.data_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <Badge variant={data.success ? "default" : "destructive"}>
                  {data.success ? "Success" : "Error"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Data Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3X3 className="h-5 w-5" />
              <span>Available Data Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(data.extracted_data).map((dataType) => (
                <div
                  key={dataType}
                  className="flex items-center space-x-2 p-3 border rounded-lg"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm capitalize">{dataType.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Metadata</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64">
                {JSON.stringify(data.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">RAS Commander Data Viewer</h2>
            <Badge variant="outline">{fileName}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {state.loading && !state.comprehensiveData && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading comprehensive HDF data...</p>
            </div>
          </div>
        )}

        {state.error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p className="font-medium">Error Loading Data</p>
                <p className="text-sm mt-2">{state.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadComprehensiveData}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.comprehensiveData && (
          <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mesh">Mesh Data</TabsTrigger>
              <TabsTrigger value="xsec">Cross Sections</TabsTrigger>
              <TabsTrigger value="plan">Plan Summary</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="mesh" className="mt-6">
              {renderDataSection(
                "Mesh Data",
                <Waves className="h-5 w-5" />,
                state.comprehensiveData.extracted_data.mesh,
                "mesh"
              )}
            </TabsContent>

            <TabsContent value="xsec" className="mt-6">
              {renderDataSection(
                "Cross Section Data",
                <BarChart3 className="h-5 w-5" />,
                state.comprehensiveData.extracted_data.cross_sections,
                "xsec"
              )}
            </TabsContent>

            <TabsContent value="plan" className="mt-6">
              {renderDataSection(
                "Plan Summary",
                <TrendingUp className="h-5 w-5" />,
                state.comprehensiveData.extracted_data.plan_summary,
                "plan"
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Extracted Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                    {JSON.stringify(state.comprehensiveData.extracted_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
