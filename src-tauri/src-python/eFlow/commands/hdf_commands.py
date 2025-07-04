"""HDF command handlers using ras-commander."""

import os
import h5py
from pathlib import Path
from typing import Dict, Any, Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from pytauri import Commands
from ..models.hdf_models import (
    FolderAnalysisRequest,
    FolderAnalysisResponse,
    HdfDataRequest,
    HdfDataResponse,
    RasCommanderStatus,
    ProjectStructureRequest,
    ProjectStructureResponse,
    HdfFileStructure,
    InitializeProjectRequest,
    InitializeProjectResponse,
    HdfDetailedStructureRequest,
    HdfDetailedStructureResponse,
    HdfDetailedNode,
    HdfDatasetRequest,
    HdfDatasetResponse,
    VtkDataRequest,
    VtkDataResponse,
    RasProjectStructureRequest,
    RasProjectStructureResponse,
    MeshDataRequest,
    MeshDataResponse,
    XsecDataRequest,
    XsecDataResponse,
    PlanSummaryRequest,
    PlanSummaryResponse,
    ComprehensiveHdfRequest,
    ComprehensiveHdfResponse
)
from ..utils.hdf_utils import analyze_folder_for_hdf_files, get_ras_commander_status
from ..utils.vtk_utils import prepare_hdf_for_vtk, detect_mesh_datasets, detect_result_datasets
from ..utils.ras_commander_utils import (
    create_comprehensive_project_tree,
    extract_comprehensive_hdf_data,
    RasProjectAnalyzer
)

# Try to import ras-commander for data extraction
try:
    import ras_commander
    RAS_COMMANDER_AVAILABLE = True
    RAS_COMMANDER_VERSION = getattr(ras_commander, '__version__', 'unknown')
except ImportError:
    RAS_COMMANDER_AVAILABLE = False
    RAS_COMMANDER_VERSION = None


def _analyze_hdf_file_structure(file_path: str) -> HdfFileStructure:
    """Analyze the structure of an HDF file."""
    try:
        filename = os.path.basename(file_path)
        size_mb = os.path.getsize(file_path) / (1024 * 1024)

        # Determine file type based on filename patterns
        filename_lower = filename.lower()
        if filename_lower.endswith('.hdf') or filename_lower.endswith('.hdf5'):
            # Check for specific HEC-RAS patterns
            if '.g' in filename_lower and '.hdf' in filename_lower:
                file_type = "geometry"
            elif '.p' in filename_lower and '.hdf' in filename_lower:
                file_type = "plan"
            elif '.u' in filename_lower and '.hdf' in filename_lower:
                file_type = "unsteady"
            elif 'geom' in filename_lower:
                file_type = "geometry"
            elif 'plan' in filename_lower:
                file_type = "plan"
            elif 'unsteady' in filename_lower or 'flow' in filename_lower:
                file_type = "unsteady"
            else:
                file_type = "generic"
        else:
            file_type = "unknown"

        # Analyze with h5py
        with h5py.File(file_path, 'r') as f:
            root_groups = list(f.keys())
            has_results = 'Results' in root_groups
            has_geometry = 'Geometry' in root_groups

            # Refine file type based on content if it was generic
            if file_type == "generic":
                if has_geometry and has_results:
                    file_type = "plan"  # Plan files typically have both geometry and results
                elif has_geometry:
                    file_type = "geometry"
                elif has_results:
                    file_type = "unsteady"

            # Check for mesh data
            has_mesh_data = False
            cell_count = None

            if has_geometry and 'Geometry' in f:
                geom_group = f['Geometry']
                if '2D Flow Areas' in geom_group:
                    has_mesh_data = True
                    flow_areas = geom_group['2D Flow Areas']
                    if hasattr(flow_areas, 'keys') and len(list(flow_areas.keys())) > 0:
                        first_area = list(flow_areas.keys())[0]
                        if first_area in flow_areas and 'Cell Points' in flow_areas[first_area]:
                            cell_points = flow_areas[first_area]['Cell Points']
                            cell_count = cell_points.shape[0] if hasattr(cell_points, 'shape') else None

        return HdfFileStructure(
            filename=filename,
            file_type=file_type,
            size_mb=round(size_mb, 2),
            root_groups=root_groups,
            has_results=has_results,
            has_geometry=has_geometry,
            has_mesh_data=has_mesh_data,
            cell_count=cell_count
        )

    except Exception as e:
        return HdfFileStructure(
            filename=os.path.basename(file_path),
            file_type="unknown",
            size_mb=0.0,
            root_groups=[],
            error=str(e)
        )


def _analyze_hdf_detailed_structure(file_path: str, max_depth: int = 10, include_attributes: bool = True) -> HdfDetailedStructureResponse:
    """Analyze the detailed structure of an HDF file."""
    try:
        filename = os.path.basename(file_path)

        if not os.path.exists(file_path):
            return HdfDetailedStructureResponse(
                filename=filename,
                file_path=file_path,
                success=False,
                error=f"File does not exist: {file_path}"
            )

        def _visit_node(name: str, obj, current_depth: int = 0) -> HdfDetailedNode:
            """Recursively visit HDF nodes."""
            node_path = name if name else "/"

            # Determine node type
            if hasattr(obj, 'keys'):  # Group
                node_type = "group"
                children = []

                # Only recurse if we haven't reached max depth
                if current_depth < max_depth:
                    for child_name in obj.keys():
                        child_obj = obj[child_name]
                        child_path = f"{node_path}/{child_name}" if node_path != "/" else f"/{child_name}"
                        child_node = _visit_node(child_path, child_obj, current_depth + 1)
                        children.append(child_node)

                # Get attributes
                attributes = {}
                if include_attributes and hasattr(obj, 'attrs'):
                    for attr_name in obj.attrs.keys():
                        try:
                            attr_value = obj.attrs[attr_name]
                            # Convert numpy types to Python types for JSON serialization
                            if hasattr(attr_value, 'item'):
                                attr_value = attr_value.item()
                            elif hasattr(attr_value, 'tolist'):
                                attr_value = attr_value.tolist()
                            attributes[attr_name] = attr_value
                        except Exception:
                            attributes[attr_name] = "<unreadable>"

                return HdfDetailedNode(
                    name=os.path.basename(node_path) if node_path != "/" else "root",
                    path=node_path,
                    type=node_type,
                    attributes=attributes,
                    children=children
                )

            else:  # Dataset
                node_type = "dataset"
                shape = list(obj.shape) if hasattr(obj, 'shape') else None
                dtype = str(obj.dtype) if hasattr(obj, 'dtype') else None
                size = obj.size if hasattr(obj, 'size') else None

                # Get attributes
                attributes = {}
                if include_attributes and hasattr(obj, 'attrs'):
                    for attr_name in obj.attrs.keys():
                        try:
                            attr_value = obj.attrs[attr_name]
                            # Convert numpy types to Python types for JSON serialization
                            if hasattr(attr_value, 'item'):
                                attr_value = attr_value.item()
                            elif hasattr(attr_value, 'tolist'):
                                attr_value = attr_value.tolist()
                            attributes[attr_name] = attr_value
                        except Exception:
                            attributes[attr_name] = "<unreadable>"

                return HdfDetailedNode(
                    name=os.path.basename(node_path),
                    path=node_path,
                    type=node_type,
                    shape=shape,
                    dtype=dtype,
                    size=size,
                    attributes=attributes,
                    children=[]
                )

        # Open file and analyze structure
        with h5py.File(file_path, 'r') as f:
            root_node = _visit_node("/", f, 0)

            # Count total groups and datasets
            def count_nodes(node: HdfDetailedNode):
                groups = 1 if node.type == "group" else 0
                datasets = 1 if node.type == "dataset" else 0

                for child in node.children:
                    child_groups, child_datasets = count_nodes(child)
                    groups += child_groups
                    datasets += child_datasets

                return groups, datasets

            total_groups, total_datasets = count_nodes(root_node)

            return HdfDetailedStructureResponse(
                filename=filename,
                file_path=file_path,
                success=True,
                root_node=root_node,
                total_groups=total_groups,
                total_datasets=total_datasets
            )

    except Exception as e:
        return HdfDetailedStructureResponse(
            filename=os.path.basename(file_path),
            file_path=file_path,
            success=False,
            error=f"Error analyzing HDF structure: {str(e)}"
        )


def _extract_dataset_data(file_path: str, dataset_path: str, max_rows: int = 1000, include_attributes: bool = True) -> HdfDatasetResponse:
    """Extract data from a specific HDF dataset."""
    try:
        filename = os.path.basename(file_path)

        if not os.path.exists(file_path):
            return HdfDatasetResponse(
                filename=filename,
                dataset_path=dataset_path,
                success=False,
                error=f"File does not exist: {file_path}"
            )

        with h5py.File(file_path, 'r') as f:
            # Navigate to the dataset
            try:
                dataset = f[dataset_path]
            except KeyError:
                return HdfDatasetResponse(
                    filename=filename,
                    dataset_path=dataset_path,
                    success=False,
                    error=f"Dataset not found: {dataset_path}"
                )

            if not isinstance(dataset, h5py.Dataset):
                return HdfDatasetResponse(
                    filename=filename,
                    dataset_path=dataset_path,
                    success=False,
                    error=f"Path is not a dataset: {dataset_path}"
                )

            # Get dataset metadata
            shape = list(dataset.shape)
            dtype = str(dataset.dtype)
            total_rows = shape[0] if len(shape) > 0 else 0

            # Extract attributes
            attributes = {}
            if include_attributes:
                for attr_name in dataset.attrs.keys():
                    try:
                        attr_value = dataset.attrs[attr_name]
                        # Convert numpy types to Python types for JSON serialization
                        if hasattr(attr_value, 'item'):
                            attr_value = attr_value.item()
                        elif hasattr(attr_value, 'tolist'):
                            attr_value = attr_value.tolist()
                        attributes[attr_name] = attr_value
                    except Exception:
                        attributes[attr_name] = str(attr_value)

            # Extract data (limit to max_rows)
            data = None
            columns = None
            is_truncated = False

            if len(shape) == 0:
                # Scalar dataset
                data = [[dataset[()]]]
                columns = ["Value"]
            elif len(shape) == 1:
                # 1D dataset
                actual_rows = min(max_rows, shape[0])
                is_truncated = shape[0] > max_rows
                data = [[dataset[i]] for i in range(actual_rows)]
                columns = ["Value"]
            elif len(shape) == 2:
                # 2D dataset (table-like)
                actual_rows = min(max_rows, shape[0])
                is_truncated = shape[0] > max_rows

                # Extract data
                dataset_slice = dataset[:actual_rows, :]
                data = dataset_slice.tolist()

                # Generate column names
                columns = [f"Column_{i}" for i in range(shape[1])]

                # Try to get column names from attributes
                if 'column_names' in attributes:
                    try:
                        attr_columns = attributes['column_names']
                        if isinstance(attr_columns, list) and len(attr_columns) == shape[1]:
                            columns = attr_columns
                    except Exception:
                        pass
            else:
                # Multi-dimensional dataset - flatten first two dimensions
                actual_rows = min(max_rows, shape[0])
                is_truncated = shape[0] > max_rows

                # Flatten the dataset for display
                dataset_slice = dataset[:actual_rows]
                flattened = dataset_slice.reshape(actual_rows, -1)
                data = flattened.tolist()
                columns = [f"Dim_{i}" for i in range(flattened.shape[1])]

            return HdfDatasetResponse(
                filename=filename,
                dataset_path=dataset_path,
                success=True,
                data=data,
                columns=columns,
                shape=shape,
                dtype=dtype,
                attributes=attributes,
                total_rows=total_rows,
                is_truncated=is_truncated
            )

    except Exception as e:
        return HdfDatasetResponse(
            filename=os.path.basename(file_path),
            dataset_path=dataset_path,
            success=False,
            error=f"Error extracting dataset data: {str(e)}"
        )


def _detect_result_datasets_simple(file_path: str) -> List[str]:
    """Detect datasets that contain simulation results."""
    result_datasets = []

    try:
        with h5py.File(file_path, 'r') as f:
            def visit_func(name, obj):
                if isinstance(obj, h5py.Dataset):
                    # Look for common result dataset patterns
                    name_lower = name.lower()
                    if any(keyword in name_lower for keyword in [
                        'results', 'velocity', 'depth', 'elevation', 'wse',
                        'flow', 'discharge', 'pressure', 'temperature'
                    ]):
                        result_datasets.append(name)

                    # Check attributes for result indicators
                    if hasattr(obj, 'attrs'):
                        for attr_name, attr_value in obj.attrs.items():
                            attr_str = str(attr_value).lower()
                            if any(keyword in attr_str for keyword in [
                                'result', 'output', 'computed', 'calculated'
                            ]):
                                if name not in result_datasets:
                                    result_datasets.append(name)
                                break

            f.visititems(visit_func)
    except Exception as e:
        print(f"Error detecting result datasets: {e}")

    return result_datasets


def _prepare_vtk_data(file_path: str, dataset_paths: List[str], result_type: str = "auto") -> VtkDataResponse:
    """Prepare HDF data for VTK visualization."""
    try:
        filename = os.path.basename(file_path)

        if not os.path.exists(file_path):
            return VtkDataResponse(
                filename=filename,
                success=False,
                error=f"File does not exist: {file_path}"
            )

        # Auto-detect result datasets if needed
        if result_type == "auto":
            detected_results = _detect_result_datasets_simple(file_path)
            if detected_results:
                dataset_paths.extend([path for path in detected_results if path not in dataset_paths])

            # Also detect mesh datasets
            mesh_datasets = detect_mesh_datasets(file_path)
            for mesh_list in mesh_datasets.values():
                dataset_paths.extend([path for path in mesh_list if path not in dataset_paths])

        vtk_data = {
            "datasets": [],
            "mesh_data": None,
            "result_data": [],
            "metadata": {}
        }

        mesh_info = {}
        result_info = {}
        visualization_type = "unknown"

        with h5py.File(file_path, 'r') as f:
            for dataset_path in dataset_paths:
                try:
                    dataset = f[dataset_path]
                    if not isinstance(dataset, h5py.Dataset):
                        continue

                    # Extract dataset information
                    dataset_info = {
                        "path": dataset_path,
                        "shape": list(dataset.shape),
                        "dtype": str(dataset.dtype),
                        "data": None,
                        "attributes": {}
                    }

                    # Extract attributes
                    for attr_name in dataset.attrs.keys():
                        try:
                            attr_value = dataset.attrs[attr_name]
                            if hasattr(attr_value, 'item'):
                                attr_value = attr_value.item()
                            elif hasattr(attr_value, 'tolist'):
                                attr_value = attr_value.tolist()
                            dataset_info["attributes"][attr_name] = attr_value
                        except Exception:
                            dataset_info["attributes"][attr_name] = str(attr_value)

                    # Determine dataset type and extract appropriate data
                    path_lower = dataset_path.lower()

                    if any(keyword in path_lower for keyword in ['geometry', 'mesh', 'coordinate', 'node', 'element']):
                        # Mesh/geometry data
                        if len(dataset.shape) <= 2:  # Reasonable size for mesh data
                            dataset_info["data"] = dataset[:].tolist()
                            mesh_info[dataset_path] = dataset_info
                            visualization_type = "mesh" if visualization_type == "unknown" else "combined"

                    elif any(keyword in path_lower for keyword in ['result', 'velocity', 'depth', 'elevation', 'flow']):
                        # Result data
                        if len(dataset.shape) <= 2 and dataset.size < 100000:  # Limit size for performance
                            dataset_info["data"] = dataset[:].tolist()
                            result_info[dataset_path] = dataset_info
                            visualization_type = "results" if visualization_type == "unknown" else "combined"

                    vtk_data["datasets"].append(dataset_info)

                except Exception as e:
                    print(f"Error processing dataset {dataset_path}: {e}")
                    continue

        # Set mesh and result data
        vtk_data["mesh_data"] = mesh_info if mesh_info else None
        vtk_data["result_data"] = list(result_info.values()) if result_info else []

        # Use VTK utilities for enhanced processing
        try:
            vtk_processing = prepare_hdf_for_vtk(file_path, dataset_paths)
            if vtk_processing["success"]:
                if vtk_processing["mesh_data"]:
                    mesh_info.update({"vtk_mesh": vtk_processing["mesh_data"]})
                if vtk_processing["result_data"]:
                    vtk_data["vtk_result_data"] = vtk_processing["result_data"]
                if vtk_processing["visualization_recommendations"]:
                    vtk_data["recommendations"] = vtk_processing["visualization_recommendations"]
        except Exception as e:
            print(f"VTK processing error: {e}")

        # Add file metadata
        vtk_data["metadata"] = {
            "filename": filename,
            "file_path": file_path,
            "total_datasets": len(dataset_paths),
            "processed_datasets": len(vtk_data["datasets"]),
            "has_mesh": bool(mesh_info),
            "has_results": bool(result_info)
        }

        return VtkDataResponse(
            filename=filename,
            success=True,
            vtk_data=vtk_data,
            mesh_info=mesh_info if mesh_info else None,
            result_info=result_info if result_info else None,
            visualization_type=visualization_type
        )

    except Exception as e:
        return VtkDataResponse(
            filename=os.path.basename(file_path),
            success=False,
            error=f"Error preparing VTK data: {str(e)}"
        )


def register_hdf_commands(commands: "Commands"):
    """Register HDF processing commands."""

    @commands.command()
    async def analyze_folder(body: FolderAnalysisRequest) -> FolderAnalysisResponse:
        """Analyze a folder for HDF files, prioritizing p*.hdf files."""
        return analyze_folder_for_hdf_files(body.folder_path)

    @commands.command()
    async def analyze_project_structure(body: ProjectStructureRequest) -> ProjectStructureResponse:
        """Analyze the complete structure of a HEC-RAS project."""
        try:
            project_path = body.project_path

            if not os.path.exists(project_path):
                return ProjectStructureResponse(
                    project_path=project_path,
                    project_name="",
                    has_prj_file=False,
                    geometry_files=[],
                    plan_files=[],
                    unsteady_files=[],
                    other_files=[],
                    total_hdf_files=0,
                    ras_commander_available=RAS_COMMANDER_AVAILABLE,
                    error=f"Project path does not exist: {project_path}"
                )

            # Get project name from path
            project_name = os.path.basename(project_path)

            # Check for .prj file
            prj_files = list(Path(project_path).glob("*.prj"))
            has_prj_file = len(prj_files) > 0

            # Get all HDF files
            hdf_files = list(Path(project_path).glob("*.hdf"))

            # Categorize files
            geometry_files = []
            plan_files = []
            unsteady_files = []
            other_files = []

            for hdf_file in hdf_files:
                structure = _analyze_hdf_file_structure(str(hdf_file))

                if structure.file_type == "geometry":
                    geometry_files.append(structure)
                elif structure.file_type == "plan":
                    plan_files.append(structure)
                elif structure.file_type == "unsteady":
                    unsteady_files.append(structure)
                else:
                    other_files.append(structure)

            # Try to get project info using ras-commander
            project_info = None
            if RAS_COMMANDER_AVAILABLE:
                try:
                    ras_prj, error = initialize_ras_project(project_path)
                    if ras_prj and not error:
                        project_info = get_project_info(ras_prj)
                except Exception:
                    pass  # Continue without project info if it fails

            return ProjectStructureResponse(
                project_path=project_path,
                project_name=project_name,
                has_prj_file=has_prj_file,
                geometry_files=sorted(geometry_files, key=lambda x: x.filename),
                plan_files=sorted(plan_files, key=lambda x: x.filename),
                unsteady_files=sorted(unsteady_files, key=lambda x: x.filename),
                other_files=sorted(other_files, key=lambda x: x.filename),
                total_hdf_files=len(hdf_files),
                ras_commander_available=RAS_COMMANDER_AVAILABLE,
                project_info=project_info
            )

        except Exception as e:
            return ProjectStructureResponse(
                project_path=body.project_path,
                project_name="",
                has_prj_file=False,
                geometry_files=[],
                plan_files=[],
                unsteady_files=[],
                other_files=[],
                total_hdf_files=0,
                ras_commander_available=RAS_COMMANDER_AVAILABLE,
                error=f"Error analyzing project structure: {str(e)}"
            )

    @commands.command()
    async def initialize_project(body: InitializeProjectRequest) -> InitializeProjectResponse:
        """Initialize a HEC-RAS project using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return InitializeProjectResponse(
                    project_path=body.project_path,
                    success=False,
                    message="ras-commander library not available",
                    error="ras-commander not installed"
                )

            if not os.path.exists(body.project_path):
                return InitializeProjectResponse(
                    project_path=body.project_path,
                    success=False,
                    message="Project path does not exist",
                    error=f"Path not found: {body.project_path}"
                )

            # Initialize the project
            ras_prj, error = initialize_ras_project(body.project_path)

            if error:
                return InitializeProjectResponse(
                    project_path=body.project_path,
                    success=False,
                    message="Failed to initialize project",
                    error=error
                )

            # Get project information
            project_info = get_project_info(ras_prj)

            return InitializeProjectResponse(
                project_path=body.project_path,
                success=True,
                is_initialized=project_info.get('is_initialized', False),
                plan_entries=project_info.get('plan_entries', []),
                geom_entries=project_info.get('geom_entries', []),
                hdf_entries=project_info.get('hdf_entries', []),
                flow_entries=project_info.get('flow_entries', []),
                message="Project initialized successfully"
            )

        except Exception as e:
            return InitializeProjectResponse(
                project_path=body.project_path,
                success=False,
                message="Error initializing project",
                error=f"Unexpected error: {str(e)}"
            )

    @commands.command()
    async def extract_hdf_data(body: HdfDataRequest) -> HdfDataResponse:
        """Extract data from an HDF file using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return HdfDataResponse(
                    filename=os.path.basename(body.file_path),
                    success=False,
                    error="ras-commander library not available"
                )

            if not os.path.exists(body.file_path):
                return HdfDataResponse(
                    filename=os.path.basename(body.file_path),
                    success=False,
                    error=f"File does not exist: {body.file_path}"
                )

            # Basic data extraction using ras-commander
            filename = os.path.basename(body.file_path)

            try:
                # Use h5py for basic file validation and ras-commander for advanced features
                import h5py

                # Basic file structure analysis
                with h5py.File(body.file_path, 'r') as f:
                    root_groups = list(f.keys())
                    has_results = 'Results' in root_groups
                    has_geometry = 'Geometry' in root_groups

                data = {
                    "file_info": {
                        "filename": filename,
                        "path": body.file_path,
                        "size": os.path.getsize(body.file_path)
                    },
                    "structure": {
                        "root_groups": root_groups,
                        "has_results": has_results,
                        "has_geometry": has_geometry
                    },
                    "ras_commander_info": {
                        "version": RAS_COMMANDER_VERSION,
                        "available": True
                    },
                    "status": "File successfully analyzed",
                    "message": "HDF file structure extracted successfully"
                }

                return HdfDataResponse(
                    filename=filename,
                    data=data,
                    success=True
                )

            except Exception as e:
                return HdfDataResponse(
                    filename=filename,
                    success=False,
                    error=f"Error processing HDF file: {str(e)}"
                )

        except Exception as e:
            return HdfDataResponse(
                filename=os.path.basename(body.file_path) if body.file_path else "unknown",
                success=False,
                error=f"Unexpected error: {str(e)}"
            )

    @commands.command()
    async def get_detailed_hdf_structure(body: HdfDetailedStructureRequest) -> HdfDetailedStructureResponse:
        """Get detailed structure of an HDF file with full hierarchy."""
        return _analyze_hdf_detailed_structure(
            body.file_path,
            body.max_depth or 10,
            body.include_attributes
        )

    @commands.command()
    async def extract_hdf_dataset(body: HdfDatasetRequest) -> HdfDatasetResponse:
        """Extract data from a specific HDF dataset."""
        return _extract_dataset_data(
            body.file_path,
            body.dataset_path,
            body.max_rows or 1000,
            body.include_attributes
        )

    @commands.command()
    async def prepare_vtk_data(body: VtkDataRequest) -> VtkDataResponse:
        """Prepare HDF data for VTK visualization."""
        return _prepare_vtk_data(
            body.file_path,
            body.dataset_paths,
            body.result_type
        )

    @commands.command()
    async def analyze_ras_project_structure(body: RasProjectStructureRequest) -> RasProjectStructureResponse:
        """Analyze RAS project structure using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return RasProjectStructureResponse(
                    success=False,
                    error="ras-commander library not available",
                    metadata={"ras_commander_available": False}
                )

            if not os.path.exists(body.project_path):
                return RasProjectStructureResponse(
                    success=False,
                    error=f"Project path does not exist: {body.project_path}"
                )

            # Create comprehensive project tree
            tree_data = create_comprehensive_project_tree(body.project_path)

            if not tree_data.get("success"):
                return RasProjectStructureResponse(
                    success=False,
                    error=tree_data.get("error", "Failed to analyze project structure")
                )

            return RasProjectStructureResponse(
                success=True,
                tree_structure=tree_data.get("tree_structure"),
                metadata=tree_data.get("metadata", {}),
                ras_commander_version=tree_data.get("ras_commander_version")
            )

        except Exception as e:
            return RasProjectStructureResponse(
                success=False,
                error=f"Unexpected error: {str(e)}"
            )

    @commands.command()
    async def extract_mesh_data(body: MeshDataRequest) -> MeshDataResponse:
        """Extract mesh data using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return MeshDataResponse(
                    success=False,
                    error="ras-commander library not available",
                    data_type=body.data_type
                )

            if not os.path.exists(body.file_path):
                return MeshDataResponse(
                    success=False,
                    error=f"File does not exist: {body.file_path}",
                    data_type=body.data_type
                )

            analyzer = RasProjectAnalyzer(os.path.dirname(body.file_path))

            if body.data_type == "timeseries" and body.mesh_name and body.variable:
                result = analyzer.get_mesh_timeseries(body.file_path, body.mesh_name, body.variable)
            elif body.data_type == "maximum":
                result = analyzer.get_mesh_max_results(body.file_path)
            else:
                result = analyzer.get_mesh_data(body.file_path)

            if result.get("success"):
                return MeshDataResponse(
                    success=True,
                    mesh_name=body.mesh_name,
                    variable=body.variable,
                    data_type=body.data_type,
                    data=result.get("data"),
                    metadata=result
                )
            else:
                return MeshDataResponse(
                    success=False,
                    error=result.get("error", "Failed to extract mesh data"),
                    data_type=body.data_type
                )

        except Exception as e:
            return MeshDataResponse(
                success=False,
                error=f"Unexpected error: {str(e)}",
                data_type=body.data_type
            )

    @commands.command()
    async def extract_xsec_data(body: XsecDataRequest) -> XsecDataResponse:
        """Extract cross-section data using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return XsecDataResponse(
                    success=False,
                    error="ras-commander library not available"
                )

            if not os.path.exists(body.file_path):
                return XsecDataResponse(
                    success=False,
                    error=f"File does not exist: {body.file_path}"
                )

            analyzer = RasProjectAnalyzer(os.path.dirname(body.file_path))
            result = analyzer.get_xsec_results(body.file_path)

            if result.get("success"):
                return XsecDataResponse(
                    success=True,
                    xsec_data=result.get("xsec_data"),
                    metadata=result
                )
            else:
                return XsecDataResponse(
                    success=False,
                    error=result.get("error", "Failed to extract cross-section data")
                )

        except Exception as e:
            return XsecDataResponse(
                success=False,
                error=f"Unexpected error: {str(e)}"
            )

    @commands.command()
    async def extract_plan_summary(body: PlanSummaryRequest) -> PlanSummaryResponse:
        """Extract plan summary data using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return PlanSummaryResponse(
                    success=False,
                    error="ras-commander library not available"
                )

            if not os.path.exists(body.file_path):
                return PlanSummaryResponse(
                    success=False,
                    error=f"File does not exist: {body.file_path}"
                )

            analyzer = RasProjectAnalyzer(os.path.dirname(body.file_path))
            result = analyzer.get_plan_runtime_data(body.file_path)

            if result.get("success"):
                return PlanSummaryResponse(
                    success=True,
                    runtime_data=result.get("runtime_data"),
                    volume_accounting=result.get("volume_accounting"),
                    metadata=result
                )
            else:
                return PlanSummaryResponse(
                    success=False,
                    error=result.get("error", "Failed to extract plan summary")
                )

        except Exception as e:
            return PlanSummaryResponse(
                success=False,
                error=f"Unexpected error: {str(e)}"
            )

    @commands.command()
    async def extract_comprehensive_hdf(body: ComprehensiveHdfRequest) -> ComprehensiveHdfResponse:
        """Extract comprehensive HDF data using ras-commander."""
        try:
            if not RAS_COMMANDER_AVAILABLE:
                return ComprehensiveHdfResponse(
                    success=False,
                    file_path=body.file_path,
                    filename=os.path.basename(body.file_path),
                    data_type="comprehensive",
                    error="ras-commander library not available"
                )

            if not os.path.exists(body.file_path):
                return ComprehensiveHdfResponse(
                    success=False,
                    file_path=body.file_path,
                    filename=os.path.basename(body.file_path),
                    data_type="comprehensive",
                    error=f"File does not exist: {body.file_path}"
                )

            # Determine data types to extract
            data_types = body.data_types if body.data_types else ["auto"]
            data_type = data_types[0] if len(data_types) == 1 else "multiple"

            result = extract_comprehensive_hdf_data(body.file_path, data_type)

            if result.get("success"):
                return ComprehensiveHdfResponse(
                    success=True,
                    file_path=body.file_path,
                    filename=os.path.basename(body.file_path),
                    data_type=data_type,
                    extracted_data=result.get("extracted_data", {}),
                    metadata=result
                )
            else:
                return ComprehensiveHdfResponse(
                    success=False,
                    file_path=body.file_path,
                    filename=os.path.basename(body.file_path),
                    data_type=data_type,
                    error=result.get("error", "Failed to extract comprehensive data")
                )

        except Exception as e:
            return ComprehensiveHdfResponse(
                success=False,
                file_path=body.file_path,
                filename=os.path.basename(body.file_path),
                data_type="comprehensive",
                error=f"Unexpected error: {str(e)}"
            )
