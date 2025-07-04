import { pyInvoke } from "tauri-plugin-pytauri-api";

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
