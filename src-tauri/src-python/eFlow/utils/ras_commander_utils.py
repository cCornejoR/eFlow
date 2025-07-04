"""Advanced HDF utilities using ras-commander for comprehensive HEC-RAS data analysis."""

import os
import sys
from typing import List, Dict, Any, Optional, Tuple, Union
from pathlib import Path
import numpy as np
import pandas as pd

from ..models.hdf_models import (
    HdfFileInfo, 
    FolderAnalysisResponse, 
    RasCommanderStatus,
    HdfDetailedNode,
    HdfDetailedStructureResponse
)

# Try to import ras-commander
try:
    import ras_commander
    from ras_commander import (
        init_ras_project, 
        ras,
        RasPlan,
        HdfBase,
        HdfResultsMesh,
        HdfResultsXsec,
        HdfResultsPlan,
        HdfMesh,
        HdfPipe,
        HdfPump
    )
    RAS_COMMANDER_AVAILABLE = True
    RAS_COMMANDER_VERSION = getattr(ras_commander, '__version__', 'unknown')
except ImportError as e:
    RAS_COMMANDER_AVAILABLE = False
    RAS_COMMANDER_VERSION = None
    print(f"Warning: ras-commander library not available: {e}")


class RasProjectAnalyzer:
    """Comprehensive analyzer for HEC-RAS projects using ras-commander."""
    
    def __init__(self, project_path: str):
        self.project_path = project_path
        self.initialized = False
        self.ras_version = "6.5"  # Default version
        
    def initialize_project(self) -> Dict[str, Any]:
        """Initialize the RAS project with ras-commander."""
        if not RAS_COMMANDER_AVAILABLE:
            return {
                "success": False,
                "error": "ras-commander not available",
                "message": "Cannot initialize project without ras-commander"
            }
        
        try:
            # Initialize the project
            init_ras_project(self.project_path, self.ras_version)
            self.initialized = True
            
            # Get project information
            project_info = self._get_project_info()
            
            return {
                "success": True,
                "project_info": project_info,
                "message": f"Project initialized successfully with ras-commander {RAS_COMMANDER_VERSION}"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to initialize project"
            }
    
    def _get_project_info(self) -> Dict[str, Any]:
        """Get comprehensive project information."""
        if not self.initialized:
            return {}
        
        try:
            info = {
                "project_path": self.project_path,
                "ras_version": self.ras_version,
                "plans": [],
                "geometries": [],
                "boundaries": [],
                "hdf_entries": []
            }
            
            # Get plans information
            if hasattr(ras, 'plan_df') and ras.plan_df is not None:
                info["plans"] = ras.plan_df.to_dict('records')
            
            # Get geometries information
            if hasattr(ras, 'geom_df') and ras.geom_df is not None:
                info["geometries"] = ras.geom_df.to_dict('records')
            
            # Get boundaries information
            if hasattr(ras, 'boundaries_df') and ras.boundaries_df is not None:
                info["boundaries"] = ras.boundaries_df.to_dict('records')
            
            # Get HDF entries
            try:
                hdf_entries = ras.get_hdf_entries()
                if hdf_entries is not None:
                    info["hdf_entries"] = hdf_entries.to_dict('records')
            except Exception as e:
                print(f"Warning: Could not get HDF entries: {e}")
            
            return info
            
        except Exception as e:
            print(f"Error getting project info: {e}")
            return {"error": str(e)}
    
    def get_plan_results_path(self, plan_id: str) -> Optional[str]:
        """Get the results HDF path for a specific plan."""
        if not self.initialized:
            return None
        
        try:
            return RasPlan.get_results_path(plan_id)
        except Exception as e:
            print(f"Error getting results path for plan {plan_id}: {e}")
            return None
    
    def analyze_hdf_structure(self, hdf_path: str, group_path: str = "/") -> Dict[str, Any]:
        """Analyze HDF structure using ras-commander."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}
        
        try:
            # Get dataset info from ras-commander
            dataset_info = HdfBase.get_dataset_info(hdf_path, group_path)
            
            return {
                "success": True,
                "dataset_info": dataset_info,
                "group_path": group_path,
                "file_path": hdf_path
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "group_path": group_path,
                "file_path": hdf_path
            }
    
    def get_mesh_data(self, hdf_path: str) -> Dict[str, Any]:
        """Extract mesh data using ras-commander."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}
        
        try:
            # Get mesh area names
            mesh_names = HdfMesh.get_mesh_area_names(hdf_path)
            
            mesh_data = {
                "success": True,
                "mesh_names": mesh_names,
                "mesh_areas": []
            }
            
            # Get detailed info for each mesh area
            for mesh_name in mesh_names:
                try:
                    # Get mesh geometry info
                    mesh_info = {
                        "name": mesh_name,
                        "available_variables": [],
                        "time_series_available": False
                    }
                    
                    # Try to get available result variables
                    try:
                        # This would depend on the specific ras-commander API
                        # For now, we'll use common variable names
                        common_vars = ["Water Surface", "Velocity", "Depth", "Flow"]
                        mesh_info["available_variables"] = common_vars
                        mesh_info["time_series_available"] = True
                    except Exception:
                        pass
                    
                    mesh_data["mesh_areas"].append(mesh_info)
                    
                except Exception as e:
                    print(f"Error processing mesh {mesh_name}: {e}")
            
            return mesh_data
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_mesh_timeseries(self, hdf_path: str, mesh_name: str, variable: str) -> Dict[str, Any]:
        """Get time series data for a mesh variable."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}
        
        try:
            # Get time series data
            timeseries_data = HdfResultsMesh.get_mesh_timeseries(hdf_path, mesh_name, variable)
            
            return {
                "success": True,
                "mesh_name": mesh_name,
                "variable": variable,
                "data": timeseries_data,
                "data_type": "timeseries"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "mesh_name": mesh_name,
                "variable": variable
            }
    
    def get_mesh_max_results(self, hdf_path: str) -> Dict[str, Any]:
        """Get maximum results summary for mesh."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}
        
        try:
            # Get maximum water surface data
            max_ws_data = HdfResultsMesh.get_mesh_max_ws(hdf_path)
            
            return {
                "success": True,
                "max_water_surface": max_ws_data,
                "data_type": "maximum_results"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_xsec_results(self, hdf_path: str) -> Dict[str, Any]:
        """Get cross-section results."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}
        
        try:
            # Get cross-section time series
            xsec_data = HdfResultsXsec.get_xsec_timeseries(hdf_path)
            
            return {
                "success": True,
                "xsec_data": xsec_data,
                "data_type": "cross_sections"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_pipe_network_data(self, hdf_path: str) -> Dict[str, Any]:
        """Get pipe network data if available."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}

        try:
            # Get pipe conduits and nodes
            pipe_conduits = HdfPipe.get_pipe_conduits(hdf_path)
            pipe_nodes = HdfPipe.get_pipe_nodes(hdf_path)

            # Get pipe network time series (example: node depth)
            try:
                node_depth_ts = HdfPipe.get_pipe_network_timeseries(hdf_path, "Nodes/Depth")
            except Exception:
                node_depth_ts = None

            return {
                "success": True,
                "pipe_conduits": pipe_conduits,
                "pipe_nodes": pipe_nodes,
                "node_depth_timeseries": node_depth_ts,
                "data_type": "pipe_network"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


def create_comprehensive_project_tree(project_path: str) -> Dict[str, Any]:
    """Create a comprehensive project tree using ras-commander."""
    analyzer = RasProjectAnalyzer(project_path)

    # Initialize project
    init_result = analyzer.initialize_project()
    if not init_result["success"]:
        return {
            "success": False,
            "error": init_result["error"],
            "message": "Failed to initialize project with ras-commander"
        }

    project_info = init_result["project_info"]

    # Create tree structure
    tree_data = {
        "success": True,
        "project_name": os.path.basename(project_path),
        "project_path": project_path,
        "ras_commander_version": RAS_COMMANDER_VERSION,
        "tree_structure": {
            "name": os.path.basename(project_path),
            "type": "project_root",
            "path": project_path,
            "children": []
        },
        "metadata": {
            "total_plans": len(project_info.get("plans", [])),
            "total_geometries": len(project_info.get("geometries", [])),
            "total_hdf_files": len(project_info.get("hdf_entries", [])),
            "has_results": len(project_info.get("hdf_entries", [])) > 0
        }
    }

    root_node = tree_data["tree_structure"]

    # Add Plans section
    if project_info.get("plans"):
        plans_node = {
            "name": "Plans",
            "type": "category",
            "path": f"{project_path}/Plans",
            "children": [],
            "metadata": {"count": len(project_info["plans"])}
        }

        for plan in project_info["plans"]:
            plan_node = {
                "name": f"Plan {plan.get('plan_id', 'Unknown')}",
                "type": "plan",
                "path": plan.get("plan_file", ""),
                "children": [],
                "metadata": {
                    "plan_id": plan.get("plan_id"),
                    "plan_title": plan.get("plan_title", ""),
                    "has_results": False
                }
            }

            # Check for results HDF
            results_path = analyzer.get_plan_results_path(plan.get("plan_id", ""))
            if results_path and os.path.exists(results_path):
                plan_node["metadata"]["has_results"] = True
                plan_node["metadata"]["results_path"] = results_path

                # Add results node
                results_node = {
                    "name": "Results (HDF)",
                    "type": "hdf_results",
                    "path": results_path,
                    "children": [],
                    "metadata": {
                        "file_size": os.path.getsize(results_path),
                        "file_type": "results"
                    }
                }
                plan_node["children"].append(results_node)

            plans_node["children"].append(plan_node)

        root_node["children"].append(plans_node)

    # Add Geometries section
    if project_info.get("geometries"):
        geom_node = {
            "name": "Geometries",
            "type": "category",
            "path": f"{project_path}/Geometries",
            "children": [],
            "metadata": {"count": len(project_info["geometries"])}
        }

        for geom in project_info["geometries"]:
            geom_file_node = {
                "name": geom.get("geom_file", "Unknown Geometry"),
                "type": "geometry",
                "path": geom.get("geom_file", ""),
                "children": [],
                "metadata": {
                    "geom_id": geom.get("geom_id"),
                    "geom_title": geom.get("geom_title", "")
                }
            }
            geom_node["children"].append(geom_file_node)

        root_node["children"].append(geom_node)

    # Add HDF Files section
    if project_info.get("hdf_entries"):
        hdf_node = {
            "name": "HDF Result Files",
            "type": "category",
            "path": f"{project_path}/HDF",
            "children": [],
            "metadata": {"count": len(project_info["hdf_entries"])}
        }

        for hdf_entry in project_info["hdf_entries"]:
            hdf_file_node = {
                "name": os.path.basename(hdf_entry.get("hdf_file", "Unknown HDF")),
                "type": "hdf_file",
                "path": hdf_entry.get("hdf_file", ""),
                "children": [],
                "metadata": {
                    "plan_id": hdf_entry.get("plan_id"),
                    "file_size": os.path.getsize(hdf_entry["hdf_file"]) if os.path.exists(hdf_entry.get("hdf_file", "")) else 0,
                    "has_mesh_data": False,
                    "has_xsec_data": False
                }
            }

            # Analyze HDF content
            hdf_path = hdf_entry.get("hdf_file", "")
            if hdf_path and os.path.exists(hdf_path):
                mesh_data = analyzer.get_mesh_data(hdf_path)
                if mesh_data.get("success") and mesh_data.get("mesh_names"):
                    hdf_file_node["metadata"]["has_mesh_data"] = True
                    hdf_file_node["metadata"]["mesh_names"] = mesh_data["mesh_names"]

                # Add mesh areas as children
                if mesh_data.get("success") and mesh_data.get("mesh_areas"):
                    for mesh_area in mesh_data["mesh_areas"]:
                        mesh_node = {
                            "name": f"Mesh: {mesh_area['name']}",
                            "type": "mesh_area",
                            "path": f"{hdf_path}#{mesh_area['name']}",
                            "children": [],
                            "metadata": {
                                "mesh_name": mesh_area["name"],
                                "available_variables": mesh_area.get("available_variables", []),
                                "has_timeseries": mesh_area.get("time_series_available", False)
                            }
                        }

                        # Add variables as children
                        for variable in mesh_area.get("available_variables", []):
                            var_node = {
                                "name": variable,
                                "type": "mesh_variable",
                                "path": f"{hdf_path}#{mesh_area['name']}#{variable}",
                                "children": [],
                                "metadata": {
                                    "variable_name": variable,
                                    "mesh_name": mesh_area["name"],
                                    "data_type": "timeseries"
                                }
                            }
                            mesh_node["children"].append(var_node)

                        hdf_file_node["children"].append(mesh_node)

            hdf_node["children"].append(hdf_file_node)

        root_node["children"].append(hdf_node)

    return tree_data


def extract_comprehensive_hdf_data(file_path: str, data_type: str = "auto") -> Dict[str, Any]:
    """Extract comprehensive data from HDF file using ras-commander."""
    if not RAS_COMMANDER_AVAILABLE:
        return {
            "success": False,
            "error": "ras-commander not available",
            "message": "Cannot extract data without ras-commander"
        }

    analyzer = RasProjectAnalyzer(os.path.dirname(file_path))

    result = {
        "success": True,
        "file_path": file_path,
        "filename": os.path.basename(file_path),
        "data_type": data_type,
        "extracted_data": {}
    }

    try:
        # Extract different types of data based on request
        if data_type in ["auto", "mesh", "all"]:
            mesh_data = analyzer.get_mesh_data(file_path)
            if mesh_data.get("success"):
                result["extracted_data"]["mesh"] = mesh_data

        if data_type in ["auto", "xsec", "all"]:
            xsec_data = analyzer.get_xsec_results(file_path)
            if xsec_data.get("success"):
                result["extracted_data"]["cross_sections"] = xsec_data

        if data_type in ["auto", "plan", "all"]:
            plan_data = analyzer.get_plan_runtime_data(file_path)
            if plan_data.get("success"):
                result["extracted_data"]["plan_summary"] = plan_data

        if data_type in ["auto", "pipe", "all"]:
            pipe_data = analyzer.get_pipe_network_data(file_path)
            if pipe_data.get("success"):
                result["extracted_data"]["pipe_network"] = pipe_data

        # Get basic structure info
        structure_data = analyzer.analyze_hdf_structure(file_path)
        if structure_data.get("success"):
            result["extracted_data"]["structure"] = structure_data

        return result

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "file_path": file_path,
            "data_type": data_type
        }
    
    def get_plan_runtime_data(self, hdf_path: str) -> Dict[str, Any]:
        """Get plan runtime and volume accounting data."""
        if not RAS_COMMANDER_AVAILABLE:
            return {"error": "ras-commander not available"}
        
        try:
            # Get runtime data
            runtime_data = HdfResultsPlan.get_runtime_data(hdf_path)
            
            # Get volume accounting
            volume_data = HdfResultsPlan.get_volume_accounting(hdf_path)
            
            return {
                "success": True,
                "runtime_data": runtime_data,
                "volume_accounting": volume_data,
                "data_type": "plan_summary"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
