"""Models for HDF file processing with ras-commander."""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class HdfFileInfo(BaseModel):
    """Information about an HDF file."""
    filename: str
    full_path: str
    size: int
    is_hdf: bool
    can_process: bool
    error: Optional[str] = None


class FolderAnalysisRequest(BaseModel):
    """Request for analyzing a folder for HDF files."""
    folder_path: str


class FolderAnalysisResponse(BaseModel):
    """Response containing folder analysis results."""
    folder_path: str
    total_files: int
    p_files: List[HdfFileInfo]  # Plan files (p*.hdf)
    other_hdf_files: List[HdfFileInfo]
    ras_commander_available: bool
    error: Optional[str] = None


class HdfDataRequest(BaseModel):
    """Request for extracting data from HDF file."""
    file_path: str
    dataset_path: Optional[str] = None


class HdfDataResponse(BaseModel):
    """Response containing HDF data."""
    filename: str
    data: Optional[Dict[str, Any]] = None
    success: bool
    error: Optional[str] = None


class RasCommanderStatus(BaseModel):
    """Status of ras-commander library."""
    available: bool
    version: Optional[str] = None
    message: str


class HdfFileStructure(BaseModel):
    """Structure information for an HDF file."""
    filename: str
    file_type: str  # 'geometry', 'plan', 'unsteady', 'generic'
    size_mb: float
    root_groups: List[str]
    has_results: bool = False
    has_geometry: bool = False
    has_mesh_data: bool = False
    cell_count: Optional[int] = None
    error: Optional[str] = None


class HdfDetailedNode(BaseModel):
    """Detailed information about an HDF node (group or dataset)."""
    name: str
    path: str
    type: str  # 'group' or 'dataset'
    shape: Optional[List[int]] = None
    dtype: Optional[str] = None
    size: Optional[int] = None
    attributes: Dict[str, Any] = {}
    children: List['HdfDetailedNode'] = []


class HdfDetailedStructureRequest(BaseModel):
    """Request for detailed HDF structure analysis."""
    file_path: str
    max_depth: Optional[int] = 10
    include_attributes: bool = True


class HdfDetailedStructureResponse(BaseModel):
    """Response containing detailed HDF structure."""
    filename: str
    file_path: str
    success: bool
    root_node: Optional[HdfDetailedNode] = None
    total_groups: int = 0
    total_datasets: int = 0
    error: Optional[str] = None


class HdfDatasetRequest(BaseModel):
    """Request for extracting specific dataset data from HDF file."""
    file_path: str
    dataset_path: str
    max_rows: Optional[int] = 1000  # Limit for large datasets
    include_attributes: bool = True


class HdfDatasetResponse(BaseModel):
    """Response containing dataset data."""
    filename: str
    dataset_path: str
    success: bool
    data: Optional[List[List[Any]]] = None  # 2D array as list of lists
    columns: Optional[List[str]] = None  # Column names if available
    shape: Optional[List[int]] = None
    dtype: Optional[str] = None
    attributes: Dict[str, Any] = {}
    total_rows: Optional[int] = None  # Total rows in dataset
    is_truncated: bool = False  # Whether data was truncated
    error: Optional[str] = None


class VtkDataRequest(BaseModel):
    """Request for converting HDF data to VTK format."""
    file_path: str
    dataset_paths: List[str]  # Multiple datasets for combined visualization
    result_type: str = "auto"  # "mesh", "results", "combined", "auto"


class VtkDataResponse(BaseModel):
    """Response containing VTK-ready data."""
    filename: str
    success: bool
    vtk_data: Optional[Dict[str, Any]] = None  # VTK-formatted data
    mesh_info: Optional[Dict[str, Any]] = None
    result_info: Optional[Dict[str, Any]] = None
    visualization_type: Optional[str] = None  # Type of visualization recommended
    error: Optional[str] = None


class ProjectStructureRequest(BaseModel):
    """Request for analyzing project structure."""
    project_path: str


class ProjectStructureResponse(BaseModel):
    """Response containing project structure analysis."""
    project_path: str
    project_name: str
    has_prj_file: bool
    geometry_files: List[HdfFileStructure]
    plan_files: List[HdfFileStructure]
    unsteady_files: List[HdfFileStructure]
    other_files: List[HdfFileStructure]
    total_hdf_files: int
    ras_commander_available: bool
    project_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class InitializeProjectRequest(BaseModel):
    """Request for initializing a RAS project."""
    project_path: str


class InitializeProjectResponse(BaseModel):
    """Response from initializing a RAS project."""
    project_path: str
    success: bool
    is_initialized: bool = False
    plan_entries: List[str] = []
    geom_entries: List[str] = []
    hdf_entries: List[str] = []
    flow_entries: List[str] = []
    message: str
    error: Optional[str] = None


# New models for ras-commander integration
class RasProjectInfo(BaseModel):
    """Information about a RAS project."""
    project_path: str
    project_name: str
    ras_version: str
    plans: List[Dict[str, Any]] = []
    geometries: List[Dict[str, Any]] = []
    boundaries: List[Dict[str, Any]] = []
    hdf_entries: List[Dict[str, Any]] = []


class RasProjectStructureRequest(BaseModel):
    """Request for analyzing RAS project structure."""
    project_path: str
    ras_version: str = "6.5"
    include_detailed_hdf: bool = True


class RasProjectStructureResponse(BaseModel):
    """Response containing RAS project structure."""
    success: bool
    project_info: Optional[RasProjectInfo] = None
    tree_structure: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}
    ras_commander_version: Optional[str] = None
    error: Optional[str] = None


class MeshDataRequest(BaseModel):
    """Request for mesh data extraction."""
    file_path: str
    mesh_name: Optional[str] = None
    variable: Optional[str] = None
    data_type: str = "timeseries"  # "timeseries", "maximum", "summary"


class MeshDataResponse(BaseModel):
    """Response containing mesh data."""
    success: bool
    mesh_name: Optional[str] = None
    variable: Optional[str] = None
    data_type: str
    data: Optional[Any] = None
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None


class XsecDataRequest(BaseModel):
    """Request for cross-section data extraction."""
    file_path: str
    xsec_id: Optional[str] = None
    variable: Optional[str] = None


class XsecDataResponse(BaseModel):
    """Response containing cross-section data."""
    success: bool
    xsec_data: Optional[Any] = None
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None


class PlanSummaryRequest(BaseModel):
    """Request for plan summary data."""
    file_path: str
    include_runtime: bool = True
    include_volume_accounting: bool = True


class PlanSummaryResponse(BaseModel):
    """Response containing plan summary data."""
    success: bool
    runtime_data: Optional[Any] = None
    volume_accounting: Optional[Any] = None
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None


class ComprehensiveHdfRequest(BaseModel):
    """Request for comprehensive HDF data extraction."""
    file_path: str
    data_types: List[str] = ["auto"]  # ["mesh", "xsec", "plan", "pipe", "all", "auto"]
    include_timeseries: bool = True
    include_maximum_results: bool = True


class ComprehensiveHdfResponse(BaseModel):
    """Response containing comprehensive HDF data."""
    success: bool
    file_path: str
    filename: str
    data_type: str
    extracted_data: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None
