import { pyInvoke } from "tauri-plugin-pytauri-api";
// import { invoke } from "@tauri-apps/api/tauri";

// Types for PyTauri commands
export interface GreetRequest {
  name: string;
}

export interface AppInfo {
  name: string;
  version: string;
  description: string;
}

export interface RasCommanderStatus {
  available: boolean;
  version?: string;
  message: string;
}

export interface HdfFileInfo {
  filename: string;
  full_path: string;
  size: number;
  is_hdf: boolean;
  can_process: boolean;
  error?: string;
}

export interface FolderAnalysisRequest {
  folder_path: string;
}

export interface FolderAnalysisResponse {
  folder_path: string;
  total_files: number;
  p_files: HdfFileInfo[];
  other_hdf_files: HdfFileInfo[];
  ras_commander_available: boolean;
  error?: string;
}

export interface HdfDataRequest {
  file_path: string;
}

export interface HdfDataResponse {
  filename: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface ProjectStructureRequest {
  project_path: string;
}

export interface ProjectStructureResponse {
  project_path: string;
  project_name: string;
  has_prj_file: boolean;
  geometry_files: string[];
  plan_files: string[];
  unsteady_files: string[];
  other_files: string[];
  total_hdf_files: number;
  ras_commander_available: boolean;
  error?: string;
}

export interface InitializeProjectRequest {
  project_path: string;
}

export interface InitializeProjectResponse {
  project_path: string;
  success: boolean;
  message: string;
  error?: string;
}

export interface HdfDetailedNode {
  name: string;
  path: string;
  type: "group" | "dataset";
  shape?: number[];
  dtype?: string;
  size?: number;
  attributes: Record<string, any>;
  children: HdfDetailedNode[];
}

export interface HdfDetailedStructureRequest {
  file_path: string;
  max_depth?: number;
  include_attributes?: boolean;
}

export interface HdfDetailedStructureResponse {
  filename: string;
  file_path: string;
  success: boolean;
  root_node?: HdfDetailedNode;
  total_groups: number;
  total_datasets: number;
  error?: string;
}

export interface HdfDatasetRequest {
  file_path: string;
  dataset_path: string;
  max_rows?: number;
  include_attributes?: boolean;
}

export interface HdfDatasetResponse {
  filename: string;
  dataset_path: string;
  success: boolean;
  data?: any[][];
  columns?: string[];
  shape?: number[];
  dtype?: string;
  attributes: Record<string, any>;
  total_rows?: number;
  is_truncated: boolean;
  error?: string;
}

export interface VtkDataRequest {
  file_path: string;
  dataset_paths: string[];
  result_type?: string;
}

export interface VtkDataResponse {
  filename: string;
  success: boolean;
  vtk_data?: Record<string, any>;
  mesh_info?: Record<string, any>;
  result_info?: Record<string, any>;
  visualization_type?: string;
  error?: string;
}

// New interfaces for ras-commander integration
export interface RasProjectInfo {
  project_path: string;
  project_name: string;
  ras_version: string;
  plans: any[];
  geometries: any[];
  boundaries: any[];
  hdf_entries: any[];
}

export interface RasProjectStructureRequest {
  project_path: string;
  ras_version?: string;
  include_detailed_hdf?: boolean;
}

export interface RasProjectStructureResponse {
  success: boolean;
  project_info?: RasProjectInfo;
  tree_structure?: any;
  metadata: Record<string, any>;
  ras_commander_version?: string;
  error?: string;
}

export interface MeshDataRequest {
  file_path: string;
  mesh_name?: string;
  variable?: string;
  data_type?: string;
}

export interface MeshDataResponse {
  success: boolean;
  mesh_name?: string;
  variable?: string;
  data_type: string;
  data?: any;
  metadata: Record<string, any>;
  error?: string;
}

export interface XsecDataRequest {
  file_path: string;
  xsec_id?: string;
  variable?: string;
}

export interface XsecDataResponse {
  success: boolean;
  xsec_data?: any;
  metadata: Record<string, any>;
  error?: string;
}

export interface PlanSummaryRequest {
  file_path: string;
  include_runtime?: boolean;
  include_volume_accounting?: boolean;
}

export interface PlanSummaryResponse {
  success: boolean;
  runtime_data?: any;
  volume_accounting?: any;
  metadata: Record<string, any>;
  error?: string;
}

export interface ComprehensiveHdfRequest {
  file_path: string;
  data_types?: string[];
  include_timeseries?: boolean;
  include_maximum_results?: boolean;
}

export interface ComprehensiveHdfResponse {
  success: boolean;
  file_path: string;
  filename: string;
  data_type: string;
  extracted_data: Record<string, any>;
  metadata: Record<string, any>;
  error?: string;
}

// Rust HDF5 Analyzer Types
export interface RustFileInfo {
  name: string;
  path: string;
  size_mb: number;
  modified: string;
  accessible: boolean;
  groups_count: number;
  datasets_count: number;
  error?: string;
}

export interface RustTreeNode {
  name: string;
  path: string;
  node_type: string; // "group" or "dataset"
  children: RustTreeNode[];
  attributes: Record<string, string>;
  shape?: number[];
  dtype?: string;
}

export interface RustFileStructure {
  file_path: string;
  root: RustTreeNode;
  total_groups: number;
  total_datasets: number;
  error?: string;
}

export interface RustHecRasData {
  file: string;
  geometry_data: Record<string, number[]>;
  results_data: Record<string, number[]>;
  metadata: Record<string, string>;
  extraction_summary: Record<string, number>;
}

// Basic commands
export async function greet(request: GreetRequest): Promise<string> {
  try {
    return await pyInvoke<string>("greet", request);
  } catch (error) {
    console.error("Error in greet command:", error);
    throw error;
  }
}

export async function getAppInfo(): Promise<AppInfo> {
  try {
    return await pyInvoke<AppInfo>("get_app_info");
  } catch (error) {
    console.error("Error getting app info:", error);
    throw error;
  }
}

export async function checkRasCommanderStatus(): Promise<RasCommanderStatus> {
  try {
    return await pyInvoke<RasCommanderStatus>("check_ras_commander_status");
  } catch (error) {
    console.error("Error checking RAS Commander status:", error);
    throw error;
  }
}

// HDF commands
export async function analyzeFolder(
  request: FolderAnalysisRequest
): Promise<FolderAnalysisResponse> {
  try {
    return await pyInvoke<FolderAnalysisResponse>("analyze_folder", request);
  } catch (error) {
    console.error("Error analyzing folder:", error);
    throw error;
  }
}

export async function analyzeProjectStructure(
  request: ProjectStructureRequest
): Promise<ProjectStructureResponse> {
  try {
    return await pyInvoke<ProjectStructureResponse>(
      "analyze_project_structure",
      request
    );
  } catch (error) {
    console.error("Error analyzing project structure:", error);
    throw error;
  }
}

export async function extractHdfData(
  request: HdfDataRequest
): Promise<HdfDataResponse> {
  try {
    return await pyInvoke<HdfDataResponse>("extract_hdf_data", request);
  } catch (error) {
    console.error("Error extracting HDF data:", error);
    throw error;
  }
}

export async function initializeProject(
  request: InitializeProjectRequest
): Promise<InitializeProjectResponse> {
  try {
    return await pyInvoke<InitializeProjectResponse>(
      "initialize_project",
      request
    );
  } catch (error) {
    console.error("Error initializing project:", error);
    throw error;
  }
}

export async function getDetailedHdfStructure(
  request: HdfDetailedStructureRequest
): Promise<HdfDetailedStructureResponse> {
  try {
    return await pyInvoke<HdfDetailedStructureResponse>(
      "get_detailed_hdf_structure",
      request
    );
  } catch (error) {
    console.error("Error getting detailed HDF structure:", error);
    throw error;
  }
}

export async function extractHdfDataset(
  request: HdfDatasetRequest
): Promise<HdfDatasetResponse> {
  try {
    return await pyInvoke<HdfDatasetResponse>("extract_hdf_dataset", request);
  } catch (error) {
    console.error("Error extracting HDF dataset:", error);
    throw error;
  }
}

export async function prepareVtkData(
  request: VtkDataRequest
): Promise<VtkDataResponse> {
  try {
    return await pyInvoke<VtkDataResponse>("prepare_vtk_data", request);
  } catch (error) {
    console.error("Error preparing VTK data:", error);
    throw error;
  }
}

// Utility functions
export async function selectProjectFolder(): Promise<string | null> {
  try {
    // Import the dialog API dynamically to handle potential import issues
    const { open } = await import("@tauri-apps/plugin-dialog");

    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Project Folder",
    });

    return selected as string | null;
  } catch (error) {
    console.error("Error opening folder dialog:", error);
    return null;
  }
}

export async function openFileDialog(
  filters?: { name: string; extensions: string[] }[]
): Promise<string | null> {
  try {
    // Import the dialog API dynamically to handle potential import issues
    const { open } = await import("@tauri-apps/plugin-dialog");

    const selected = await open({
      directory: false,
      multiple: false,
      title: "Select File",
      filters: filters || [
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });

    return selected as string | null;
  } catch (error) {
    console.error("Error opening file dialog:", error);
    return null;
  }
}

// New ras-commander functions
export async function analyzeRasProjectStructure(
  request: RasProjectStructureRequest
): Promise<RasProjectStructureResponse> {
  try {
    return await pyInvoke<RasProjectStructureResponse>(
      "analyze_ras_project_structure",
      request
    );
  } catch (error) {
    console.error("Error analyzing RAS project structure:", error);
    throw error;
  }
}

export async function extractMeshData(
  request: MeshDataRequest
): Promise<MeshDataResponse> {
  try {
    return await pyInvoke<MeshDataResponse>("extract_mesh_data", request);
  } catch (error) {
    console.error("Error extracting mesh data:", error);
    throw error;
  }
}

export async function extractXsecData(
  request: XsecDataRequest
): Promise<XsecDataResponse> {
  try {
    return await pyInvoke<XsecDataResponse>("extract_xsec_data", request);
  } catch (error) {
    console.error("Error extracting cross-section data:", error);
    throw error;
  }
}

export async function extractPlanSummary(
  request: PlanSummaryRequest
): Promise<PlanSummaryResponse> {
  try {
    return await pyInvoke<PlanSummaryResponse>("extract_plan_summary", request);
  } catch (error) {
    console.error("Error extracting plan summary:", error);
    throw error;
  }
}

export async function extractComprehensiveHdf(
  request: ComprehensiveHdfRequest
): Promise<ComprehensiveHdfResponse> {
  try {
    return await pyInvoke<ComprehensiveHdfResponse>(
      "extract_comprehensive_hdf",
      request
    );
  } catch (error) {
    console.error("Error extracting comprehensive HDF data:", error);
    throw error;
  }
}

// HDF Explorer Types
export interface HdfExplorerFileInfo {
  path: string;
  name: string;
  size_mb: number;
  accessible: boolean;
  groups: number;
  datasets: number;
  modified: string;
}

export interface HdfExplorerFilesResponse {
  success: boolean;
  files: HdfExplorerFileInfo[];
  count: number;
  error?: string;
}

export interface HdfExplorerStructureNode {
  type: "group" | "dataset";
  children?: Record<string, HdfExplorerStructureNode>;
  shape?: number[];
  dtype?: string;
  size?: number;
  attrs?: Record<string, any>;
}

export interface HdfExplorerStructureResponse {
  success: boolean;
  tree: Record<string, HdfExplorerStructureNode>;
  total_groups: number;
  total_datasets: number;
  error?: string;
}

export interface HdfExplorerDataset {
  name: string;
  path: string;
  shape: number[];
  dtype: string;
  size: number;
  size_mb: number;
  attributes: Record<string, any>;
}

export interface HdfExplorerDatasetsResponse {
  success: boolean;
  datasets: HdfExplorerDataset[];
  total_count: number;
  showing: number;
  error?: string;
}

export interface HdfExplorerAnalysisResponse {
  success: boolean;
  file_info: HdfExplorerFileInfo;
  structure: {
    total_groups: number;
    total_datasets: number;
    tree: Record<string, HdfExplorerStructureNode>;
  };
  hecras_data: {
    metadata: Record<string, any>;
    extraction_summary: Record<string, string>;
    extracted_data: Record<string, any>;
  };
  top_datasets: Array<{
    name: string;
    path: string;
    shape: number[];
    dtype: string;
    size_mb: number;
  }>;
  error?: string;
}

export interface HdfExplorerDataSampleResponse {
  success: boolean;
  data: any[];
  metadata: {
    path: string;
    shape: number[];
    dtype: string;
    size: number;
    attributes: Record<string, any>;
  };
  error?: string;
}

export interface HdfExplorerFilterResponse {
  success: boolean;
  filtered_files: HdfExplorerFileInfo[];
  count: number;
  filter_type: string;
  error?: string;
}

export interface HdfExplorerSearchResponse {
  success: boolean;
  matching_datasets: HdfExplorerDataset[];
  count: number;
  search_term: string;
  error?: string;
}

// HDF Explorer Command Functions
export async function testHdfConnection(): Promise<any> {
  try {
    return await pyInvoke("test_hdf_connection", {});
  } catch (error) {
    console.error("Error testing HDF connection:", error);
    throw error;
  }
}

export async function findHdfFiles(
  projectPath: string
): Promise<HdfExplorerFilesResponse> {
  try {
    return await pyInvoke<HdfExplorerFilesResponse>("find_hdf_files", {
      project_path: projectPath,
    });
  } catch (error) {
    console.error("Error finding HDF files:", error);
    throw error;
  }
}

export async function analyzeHdfFile(
  filePath: string
): Promise<HdfExplorerAnalysisResponse> {
  try {
    return await pyInvoke<HdfExplorerAnalysisResponse>("analyze_hdf_file", {
      file_path: filePath,
    });
  } catch (error) {
    console.error("Error analyzing HDF file:", error);
    throw error;
  }
}

export async function getHdfStructureTree(
  filePath: string,
  maxDepth: number = 3
): Promise<HdfExplorerStructureResponse> {
  try {
    return await pyInvoke<HdfExplorerStructureResponse>(
      "get_hdf_structure_tree",
      {
        file_path: filePath,
        max_depth: maxDepth,
      }
    );
  } catch (error) {
    console.error("Error getting HDF structure tree:", error);
    throw error;
  }
}

export async function getHdfDatasetsList(
  filePath: string,
  limit: number = 50
): Promise<HdfExplorerDatasetsResponse> {
  try {
    return await pyInvoke<HdfExplorerDatasetsResponse>(
      "get_hdf_datasets_list",
      {
        file_path: filePath,
        limit,
      }
    );
  } catch (error) {
    console.error("Error getting HDF datasets list:", error);
    throw error;
  }
}

// Rust HDF5 Analyzer Commands (temporarily using Python backend)
export async function analyzeHdf5Info(filePath: string): Promise<RustFileInfo> {
  try {
    // TODO: Replace with Rust invoke when ready
    // return await invoke<RustFileInfo>("analyze_hdf5_info", { filePath });

    // For now, create a mock response based on file stats
    const stats = await getFileStats(filePath);
    return {
      name:
        filePath.split("/").pop() || filePath.split("\\").pop() || "unknown",
      path: filePath,
      size_mb: stats.size / (1024 * 1024),
      modified: new Date().toISOString(),
      accessible: true,
      groups_count: 5, // Mock data
      datasets_count: 15, // Mock data
    };
  } catch (error) {
    console.error("Error analyzing HDF5 file info:", error);
    throw error;
  }
}

export async function analyzeHdf5Structure(
  filePath: string
): Promise<RustFileStructure> {
  try {
    // TODO: Replace with Rust invoke when ready
    // return await invoke<RustFileStructure>("analyze_hdf5_structure", { filePath });

    // For now, create a mock structure
    return {
      file_path: filePath,
      root: {
        name: "root",
        path: "/",
        node_type: "group",
        children: [
          {
            name: "Geometry",
            path: "/Geometry",
            node_type: "group",
            children: [],
            attributes: {},
          },
          {
            name: "Results",
            path: "/Results",
            node_type: "group",
            children: [],
            attributes: {},
          },
        ],
        attributes: {},
      },
      total_groups: 5,
      total_datasets: 15,
    };
  } catch (error) {
    console.error("Error analyzing HDF5 file structure:", error);
    throw error;
  }
}

export async function listHdf5Datasets(filePath: string): Promise<string[]> {
  try {
    // TODO: Replace with Rust invoke when ready
    // return await invoke<string[]>("list_hdf5_datasets", { filePath });

    // For now, return mock datasets
    return [
      "/Geometry/2D Flow Areas/Area 2D/Cells Center Coordinate",
      "/Results/2D/MaxWSE",
      "/Results/2D/Velocity",
      "/Plan Data/Plan Information",
      "/Event Conditions/Unsteady",
    ];
  } catch (error) {
    console.error("Error listing HDF5 datasets:", error);
    throw error;
  }
}

export async function extractHecRasData(
  filePath: string
): Promise<RustHecRasData> {
  try {
    // TODO: Replace with Rust invoke when ready
    // return await invoke<RustHecRasData>("extract_hecras_data", { filePath });

    // For now, return mock HEC-RAS data
    return {
      file: filePath,
      geometry_data: {
        "/Geometry/2D Flow Areas/Area 2D/Cells Center Coordinate": [
          1.0, 2.0, 3.0, 4.0, 5.0,
        ],
      },
      results_data: {
        "/Results/2D/MaxWSE": [10.5, 11.2, 9.8, 12.1, 10.9],
      },
      metadata: {
        "File Type": "HEC-RAS Plan File",
        Version: "6.3.1",
      },
      extraction_summary: {
        geometry_datasets: 1,
        results_datasets: 1,
      },
    };
  } catch (error) {
    console.error("Error extracting HEC-RAS data:", error);
    throw error;
  }
}

export async function readHdf5DatasetSample(
  filePath: string,
  datasetPath: string,
  maxElements: number = 10
): Promise<number[]> {
  try {
    // TODO: Replace with Rust invoke when ready
    // return await invoke<number[]>("read_hdf5_dataset_sample", { filePath, datasetPath, maxElements });

    // For now, return mock data
    const mockData = [10.5, 11.2, 9.8, 12.1, 10.9, 11.5, 10.3, 12.8, 9.5, 11.8];
    return mockData.slice(0, maxElements);
  } catch (error) {
    console.error("Error reading HDF5 dataset sample:", error);
    throw error;
  }
}

export async function findHdf5Files(
  folderPath: string
): Promise<RustFileInfo[]> {
  try {
    // TODO: Replace with Rust invoke when ready
    // return await invoke<RustFileInfo[]>("find_hdf5_files", { folderPath });

    // For now, use the existing Python backend
    const response = await findHdfFiles(folderPath);

    if (!response.success) {
      throw new Error(response.error || "Error finding HDF files");
    }

    // Convert Python response to Rust format
    return response.files.map((file) => ({
      name: file.filename,
      path: file.full_path,
      size_mb: file.size / (1024 * 1024),
      modified: new Date().toISOString(), // Mock date
      accessible: file.can_process,
      groups_count: 5, // Mock data
      datasets_count: 15, // Mock data
      error: file.error,
    }));
  } catch (error) {
    console.error("Error finding HDF5 files:", error);
    throw error;
  }
}

// Helper function to get file stats
async function getFileStats(filePath: string): Promise<{ size: number }> {
  // Mock implementation - in real scenario would use file system API
  return { size: 1024 * 1024 * 10 }; // 10MB mock size
}

export async function extractHecrasSpecificData(
  filePath: string
): Promise<any> {
  try {
    return await pyInvoke("extract_hecras_specific_data", {
      file_path: filePath,
    });
  } catch (error) {
    console.error("Error extracting HEC-RAS specific data:", error);
    throw error;
  }
}

export async function extractDatasetSample(
  filePath: string,
  datasetPath: string,
  maxSamples: number = 100
): Promise<HdfExplorerDataSampleResponse> {
  try {
    return await pyInvoke<HdfExplorerDataSampleResponse>(
      "extract_dataset_sample",
      {
        file_path: filePath,
        dataset_path: datasetPath,
        max_samples: maxSamples,
      }
    );
  } catch (error) {
    console.error("Error extracting dataset sample:", error);
    throw error;
  }
}

export async function filterHdfFilesByType(
  files: HdfExplorerFileInfo[],
  fileType: string = "all"
): Promise<HdfExplorerFilterResponse> {
  try {
    return await pyInvoke<HdfExplorerFilterResponse>(
      "filter_hdf_files_by_type",
      {
        files,
        file_type: fileType,
      }
    );
  } catch (error) {
    console.error("Error filtering HDF files:", error);
    throw error;
  }
}

export async function searchDatasets(
  filePath: string,
  searchTerm: string
): Promise<HdfExplorerSearchResponse> {
  try {
    return await pyInvoke<HdfExplorerSearchResponse>("search_datasets", {
      file_path: filePath,
      search_term: searchTerm,
    });
  } catch (error) {
    console.error("Error searching datasets:", error);
    throw error;
  }
}
