// Re-export types from tauri-commands for backward compatibility
export type {
  GreetRequest,
  AppInfo,
  RasCommanderStatus,
  HdfFileInfo,
  FolderAnalysisRequest,
  FolderAnalysisResponse,
  HdfDataRequest,
  HdfDataResponse,
  ProjectStructureRequest,
  ProjectStructureResponse,
  InitializeProjectRequest,
  InitializeProjectResponse,
} from "@/lib/tauri-commands";

// Additional types specific to the UI components
export interface ProjectTreeNode {
  id: string;
  name: string;
  type:
    | "folder"
    | "file"
    | "hdf"
    | "plan"
    | "project"
    | "geometry"
    | "unsteady"
    | "other";
  path: string;
  children?: ProjectTreeNode[];
  size?: number;
  size_mb?: number;
  cell_count?: number;
  isHdf?: boolean;
  canProcess?: boolean;
  error?: string;
  has_results?: boolean;
  has_geometry?: boolean;
  file_info?: {
    filename: string;
    file_type: string;
    size_mb: number;
    cell_count: number;
    has_results: boolean;
    has_geometry: boolean;
    error?: string;
    internal_structure?: HdfInternalStructure;
  };
}

export interface VtkViewerData {
  filename: string;
  file_type: string;
  data?: any;
  metadata?: {
    cell_count: number;
    size_mb: number;
    has_results: boolean;
    has_geometry: boolean;
    fileType?: string;
    size?: number;
    lastModified?: string;
    hasResults?: boolean;
    hasGeometry?: boolean;
    hasMeshData?: boolean;
    cellCount?: number;
  };
}

export interface FileAnalysisResult {
  success: boolean;
  data?: VtkViewerData;
  error?: string;
}

export interface ProjectAnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentFile?: string;
  error?: string;
}

export interface RasCommanderConfig {
  available: boolean;
  version?: string;
  pythonPath?: string;
  rasPath?: string;
  lastCheck?: Date;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  autoCheckRasCommander: boolean;
  defaultProjectPath?: string;
  recentProjects: string[];
  maxRecentProjects: number;
}

// Enums for better type safety
export enum FileType {
  UNKNOWN = "unknown",
  HDF = "hdf",
  PLAN = "plan",
  GEOMETRY = "geometry",
  UNSTEADY = "unsteady",
  RESULTS = "results",
  PROJECT = "project",
}

export enum AnalysisStatus {
  IDLE = "idle",
  ANALYZING = "analyzing",
  COMPLETED = "completed",
  ERROR = "error",
}

export enum RasCommanderState {
  UNKNOWN = "unknown",
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
  ERROR = "error",
  CHECKING = "checking",
}

// Utility type for async operations
export interface AsyncOperation<T = any> {
  isLoading: boolean;
  data?: T;
  error?: string;
  lastUpdated?: Date;
}

// Event types for component communication
export interface ProjectEvent {
  type:
    | "project_loaded"
    | "project_error"
    | "file_selected"
    | "analysis_complete";
  payload?: any;
  timestamp: Date;
}

export interface NotificationEvent {
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// TreeView types
export interface TreeNode {
  id: string;
  name: string;
  type: string;
  path?: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  metadata?: any;
}

export interface TreeViewProps {
  data: TreeNode[];
  onNodeSelect?: (node: TreeNode) => void;
  onNodeExpand?: (node: TreeNode) => void;
  selectedNodeId?: string;
  className?: string;
}

export const TREE_NODE_ICONS = {
  folder: "📁",
  file: "📄",
  hdf: "📊",
  plan: "📋",
  project: "🏗️",
  geometry: "🔷",
  unsteady: "🌊",
  other: "📄",
} as const;

// HDF File Structure types (for internal HDF content)
export interface HdfInternalStructure {
  name: string;
  path: string;
  type: "group" | "dataset";
  children?: HdfInternalStructure[];
  attributes?: Record<string, any>;
  shape?: number[];
  dtype?: string;
}

// Detailed HDF Structure types (for comprehensive analysis)
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

// HDF File Structure from backend (file-level information)
export interface HdfFileStructure {
  filename: string;
  file_type: string; // 'geometry', 'plan', 'unsteady', 'generic'
  size_mb: number;
  root_groups: string[];
  has_results: boolean;
  has_geometry: boolean;
  has_mesh_data: boolean;
  cell_count?: number;
  error?: string;
  // Internal structure (if available)
  internal_structure?: HdfInternalStructure;
}

// Enhanced HDF data types for comprehensive viewing
export interface HdfDatasetData {
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

export interface HdfVtkData {
  filename: string;
  success: boolean;
  vtk_data?: Record<string, any>;
  mesh_info?: Record<string, any>;
  result_info?: Record<string, any>;
  visualization_type?: string;
  error?: string;
}
