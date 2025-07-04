"""VTK utility functions for HDF data visualization."""

import os
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
import h5py

# Try to import VTK
try:
    import vtk
    VTK_AVAILABLE = True
except ImportError:
    VTK_AVAILABLE = False
    print("Warning: VTK library not available")

# Try to import PyVista
try:
    import pyvista as pv
    PYVISTA_AVAILABLE = True
except ImportError:
    PYVISTA_AVAILABLE = False
    print("Warning: PyVista library not available")


def detect_mesh_datasets(file_path: str) -> Dict[str, List[str]]:
    """Detect datasets that contain mesh/geometry information."""
    mesh_datasets = {
        "coordinates": [],
        "connectivity": [],
        "elements": [],
        "nodes": [],
        "faces": [],
        "cells": []
    }
    
    try:
        with h5py.File(file_path, 'r') as f:
            def visit_func(name, obj):
                if isinstance(obj, h5py.Dataset):
                    name_lower = name.lower()
                    
                    # Check for coordinate data
                    if any(keyword in name_lower for keyword in [
                        'coordinate', 'coord', 'x_coord', 'y_coord', 'z_coord',
                        'node_coord', 'vertex', 'point'
                    ]):
                        mesh_datasets["coordinates"].append(name)
                    
                    # Check for connectivity data
                    elif any(keyword in name_lower for keyword in [
                        'connect', 'element', 'cell', 'triangle', 'quad',
                        'face_node', 'element_node'
                    ]):
                        mesh_datasets["connectivity"].append(name)
                    
                    # Check for element data
                    elif any(keyword in name_lower for keyword in [
                        'element_id', 'cell_id', 'face_id'
                    ]):
                        mesh_datasets["elements"].append(name)
                    
                    # Check for node data
                    elif any(keyword in name_lower for keyword in [
                        'node_id', 'vertex_id', 'point_id'
                    ]):
                        mesh_datasets["nodes"].append(name)
            
            f.visititems(visit_func)
    except Exception as e:
        print(f"Error detecting mesh datasets: {e}")
    
    return mesh_datasets


def detect_result_datasets(file_path: str) -> Dict[str, List[str]]:
    """Detect datasets that contain simulation results."""
    result_datasets = {
        "scalar_results": [],
        "vector_results": [],
        "time_series": [],
        "statistics": []
    }
    
    try:
        with h5py.File(file_path, 'r') as f:
            def visit_func(name, obj):
                if isinstance(obj, h5py.Dataset):
                    name_lower = name.lower()
                    shape = obj.shape
                    
                    # Check for scalar results
                    if any(keyword in name_lower for keyword in [
                        'depth', 'elevation', 'wse', 'pressure', 'temperature',
                        'concentration', 'scalar'
                    ]):
                        result_datasets["scalar_results"].append(name)
                    
                    # Check for vector results
                    elif any(keyword in name_lower for keyword in [
                        'velocity', 'flow', 'discharge', 'vector', 'gradient'
                    ]):
                        result_datasets["vector_results"].append(name)
                    
                    # Check for time series (datasets with time dimension)
                    elif any(keyword in name_lower for keyword in [
                        'time', 'step', 'iteration', 'temporal'
                    ]) or (len(shape) > 1 and shape[0] > shape[1]):
                        result_datasets["time_series"].append(name)
                    
                    # Check for statistical data
                    elif any(keyword in name_lower for keyword in [
                        'min', 'max', 'mean', 'std', 'average', 'statistics'
                    ]):
                        result_datasets["statistics"].append(name)
            
            f.visititems(visit_func)
    except Exception as e:
        print(f"Error detecting result datasets: {e}")
    
    return result_datasets


def extract_mesh_data(file_path: str, mesh_datasets: Dict[str, List[str]]) -> Optional[Dict[str, Any]]:
    """Extract mesh data for VTK visualization."""
    if not VTK_AVAILABLE:
        return None
    
    mesh_data = {
        "points": None,
        "cells": None,
        "point_data": {},
        "cell_data": {},
        "metadata": {}
    }
    
    try:
        with h5py.File(file_path, 'r') as f:
            # Extract coordinate data
            if mesh_datasets["coordinates"]:
                coord_path = mesh_datasets["coordinates"][0]
                coords = f[coord_path][:]
                
                if coords.ndim == 2:
                    if coords.shape[1] == 2:
                        # 2D coordinates - add z=0
                        points = np.column_stack([coords, np.zeros(coords.shape[0])])
                    elif coords.shape[1] >= 3:
                        # 3D coordinates
                        points = coords[:, :3]
                    else:
                        points = None
                else:
                    points = None
                
                mesh_data["points"] = points
            
            # Extract connectivity data
            if mesh_datasets["connectivity"] and mesh_data["points"] is not None:
                conn_path = mesh_datasets["connectivity"][0]
                connectivity = f[conn_path][:]
                
                if connectivity.ndim == 2:
                    mesh_data["cells"] = connectivity
            
            # Extract additional mesh metadata
            mesh_data["metadata"] = {
                "coordinate_datasets": mesh_datasets["coordinates"],
                "connectivity_datasets": mesh_datasets["connectivity"],
                "num_points": len(mesh_data["points"]) if mesh_data["points"] is not None else 0,
                "num_cells": len(mesh_data["cells"]) if mesh_data["cells"] is not None else 0
            }
    
    except Exception as e:
        print(f"Error extracting mesh data: {e}")
        return None
    
    return mesh_data


def create_vtk_unstructured_grid(mesh_data: Dict[str, Any]) -> Optional[Any]:
    """Create a VTK unstructured grid from mesh data."""
    if not VTK_AVAILABLE or not mesh_data["points"] is not None:
        return None
    
    try:
        # Create VTK points
        points = vtk.vtkPoints()
        for point in mesh_data["points"]:
            points.InsertNextPoint(point)
        
        # Create VTK unstructured grid
        ugrid = vtk.vtkUnstructuredGrid()
        ugrid.SetPoints(points)
        
        # Add cells if available
        if mesh_data["cells"] is not None:
            for cell in mesh_data["cells"]:
                if len(cell) == 3:  # Triangle
                    triangle = vtk.vtkTriangle()
                    for i, node_id in enumerate(cell):
                        triangle.GetPointIds().SetId(i, node_id)
                    ugrid.InsertNextCell(triangle.GetCellType(), triangle.GetPointIds())
                elif len(cell) == 4:  # Quad
                    quad = vtk.vtkQuad()
                    for i, node_id in enumerate(cell):
                        quad.GetPointIds().SetId(i, node_id)
                    ugrid.InsertNextCell(quad.GetCellType(), quad.GetPointIds())
        
        return ugrid
    
    except Exception as e:
        print(f"Error creating VTK unstructured grid: {e}")
        return None


def prepare_hdf_for_vtk(file_path: str, dataset_paths: List[str] = None) -> Dict[str, Any]:
    """Prepare HDF data for VTK visualization."""
    result = {
        "success": False,
        "mesh_data": None,
        "result_data": None,
        "vtk_objects": [],
        "visualization_recommendations": [],
        "error": None
    }
    
    try:
        # Detect mesh and result datasets
        mesh_datasets = detect_mesh_datasets(file_path)
        result_datasets = detect_result_datasets(file_path)
        
        # Extract mesh data
        if any(mesh_datasets.values()):
            mesh_data = extract_mesh_data(file_path, mesh_datasets)
            if mesh_data:
                result["mesh_data"] = mesh_data
                
                # Create VTK object if possible
                if VTK_AVAILABLE:
                    vtk_grid = create_vtk_unstructured_grid(mesh_data)
                    if vtk_grid:
                        result["vtk_objects"].append({
                            "type": "unstructured_grid",
                            "object": vtk_grid,
                            "description": "Mesh geometry"
                        })
        
        # Process result data
        if any(result_datasets.values()):
            result["result_data"] = result_datasets
            
            # Add visualization recommendations
            if result_datasets["scalar_results"]:
                result["visualization_recommendations"].append("scalar_field_visualization")
            if result_datasets["vector_results"]:
                result["visualization_recommendations"].append("vector_field_visualization")
            if result_datasets["time_series"]:
                result["visualization_recommendations"].append("temporal_animation")
        
        result["success"] = True
        
    except Exception as e:
        result["error"] = str(e)
    
    return result


def export_to_vtk_file(mesh_data: Dict[str, Any], output_path: str) -> bool:
    """Export mesh data to VTK file format."""
    if not VTK_AVAILABLE:
        return False
    
    try:
        ugrid = create_vtk_unstructured_grid(mesh_data)
        if ugrid is None:
            return False
        
        writer = vtk.vtkUnstructuredGridWriter()
        writer.SetFileName(output_path)
        writer.SetInputData(ugrid)
        writer.Write()
        
        return True
    
    except Exception as e:
        print(f"Error exporting to VTK file: {e}")
        return False
