"""Tests for comprehensive HDF functionality."""

import pytest
import os
import sys
import tempfile
import h5py
import numpy as np
from pathlib import Path

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

# Import only the specific functions we need to test, avoiding PyTauri imports
from eFlow.models.hdf_models import (
    HdfDetailedStructureRequest,
    HdfDatasetRequest,
    VtkDataRequest,
    HdfDetailedStructureResponse,
    HdfDatasetResponse,
    VtkDataResponse,
    HdfDetailedNode
)

# Import the utility functions directly
from eFlow.utils.vtk_utils import (
    detect_mesh_datasets,
    detect_result_datasets,
    prepare_hdf_for_vtk
)


def create_test_hdf_file(file_path: str):
    """Create a test HDF file with various data types."""
    with h5py.File(file_path, 'w') as f:
        # Create groups
        geometry_group = f.create_group('Geometry')
        results_group = f.create_group('Results')
        
        # Create coordinate datasets
        coords = np.random.rand(100, 3) * 1000  # 100 points in 3D
        geometry_group.create_dataset('Coordinates', data=coords)
        geometry_group['Coordinates'].attrs['units'] = 'meters'
        geometry_group['Coordinates'].attrs['description'] = 'Node coordinates'
        
        # Create connectivity dataset
        connectivity = np.random.randint(0, 100, (50, 4))  # 50 quads
        geometry_group.create_dataset('Connectivity', data=connectivity)
        geometry_group['Connectivity'].attrs['element_type'] = 'quad'
        
        # Create result datasets
        depth_data = np.random.rand(100) * 10  # Depth at each node
        results_group.create_dataset('Water_Depth', data=depth_data)
        results_group['Water_Depth'].attrs['units'] = 'meters'
        results_group['Water_Depth'].attrs['description'] = 'Water depth at nodes'
        
        velocity_data = np.random.rand(100, 2) * 5  # 2D velocity vectors
        results_group.create_dataset('Velocity', data=velocity_data)
        results_group['Velocity'].attrs['units'] = 'm/s'
        results_group['Velocity'].attrs['description'] = 'Velocity vectors'
        
        # Create time series data
        time_steps = 10
        time_series = np.random.rand(time_steps, 100) * 15
        results_group.create_dataset('Time_Series_Depth', data=time_series)
        results_group['Time_Series_Depth'].attrs['time_steps'] = time_steps
        results_group['Time_Series_Depth'].attrs['description'] = 'Depth over time'
        
        # Create scalar dataset
        elevation = np.random.rand(100) * 100 + 1000  # Elevation
        geometry_group.create_dataset('Elevation', data=elevation)
        geometry_group['Elevation'].attrs['units'] = 'meters'
        geometry_group['Elevation'].attrs['datum'] = 'NAVD88'


def analyze_hdf_structure_simple(file_path: str) -> dict:
    """Simple HDF structure analysis for testing."""
    try:
        with h5py.File(file_path, 'r') as f:
            def visit_node(name, obj, current_depth=0):
                node_info = {
                    "name": name.split('/')[-1] if name else "/",
                    "path": name if name else "/",
                    "type": "group" if isinstance(obj, h5py.Group) else "dataset",
                    "children": []
                }

                if isinstance(obj, h5py.Dataset):
                    node_info["shape"] = list(obj.shape)
                    node_info["dtype"] = str(obj.dtype)
                    node_info["attributes"] = dict(obj.attrs)
                elif isinstance(obj, h5py.Group):
                    for child_name in obj.keys():
                        child_path = f"{name}/{child_name}" if name else child_name
                        child_node = visit_node(child_path, obj[child_name], current_depth + 1)
                        node_info["children"].append(child_node)

                return node_info

            root_node = visit_node("/", f, 0)

            # Count nodes
            def count_nodes(node):
                groups = 1 if node["type"] == "group" else 0
                datasets = 1 if node["type"] == "dataset" else 0
                for child in node["children"]:
                    child_groups, child_datasets = count_nodes(child)
                    groups += child_groups
                    datasets += child_datasets
                return groups, datasets

            total_groups, total_datasets = count_nodes(root_node)

            return {
                "success": True,
                "root_node": root_node,
                "total_groups": total_groups,
                "total_datasets": total_datasets,
                "filename": os.path.basename(file_path)
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


def extract_dataset_simple(file_path: str, dataset_path: str, max_rows: int = 1000) -> dict:
    """Simple dataset extraction for testing."""
    try:
        with h5py.File(file_path, 'r') as f:
            dataset = f[dataset_path]

            if not isinstance(dataset, h5py.Dataset):
                return {"success": False, "error": "Path is not a dataset"}

            shape = list(dataset.shape)
            dtype = str(dataset.dtype)
            total_rows = shape[0] if len(shape) > 0 else 0

            # Extract attributes
            attributes = dict(dataset.attrs)

            # Extract data
            if len(shape) == 0:
                data = [[dataset[()]]]
                columns = ["Value"]
            elif len(shape) == 1:
                actual_rows = min(max_rows, shape[0])
                data = [[dataset[i]] for i in range(actual_rows)]
                columns = ["Value"]
            elif len(shape) == 2:
                actual_rows = min(max_rows, shape[0])
                data = dataset[:actual_rows, :].tolist()
                columns = [f"Column_{i}" for i in range(shape[1])]
            else:
                actual_rows = min(max_rows, shape[0])
                flattened = dataset[:actual_rows].reshape(actual_rows, -1)
                data = flattened.tolist()
                columns = [f"Dim_{i}" for i in range(flattened.shape[1])]

            is_truncated = total_rows > max_rows

            return {
                "success": True,
                "data": data,
                "columns": columns,
                "shape": shape,
                "dtype": dtype,
                "attributes": attributes,
                "total_rows": total_rows,
                "is_truncated": is_truncated
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


class TestHdfComprehensive:
    """Test comprehensive HDF functionality."""
    
    @pytest.fixture
    def test_hdf_file(self):
        """Create a temporary HDF file for testing."""
        with tempfile.NamedTemporaryFile(suffix='.hdf', delete=False) as tmp:
            create_test_hdf_file(tmp.name)
            yield tmp.name
        os.unlink(tmp.name)
    
    def test_detailed_structure_analysis(self, test_hdf_file):
        """Test detailed HDF structure analysis."""
        response = analyze_hdf_structure_simple(test_hdf_file)

        assert response["success"]
        assert response["root_node"] is not None
        assert response["total_groups"] >= 2  # Geometry and Results groups
        assert response["total_datasets"] >= 5  # Various datasets we created
        assert response["filename"].endswith('.hdf')

        # Check that we have the expected groups
        root_children = [child["name"] for child in response["root_node"]["children"]]
        assert 'Geometry' in root_children
        assert 'Results' in root_children
    
    def test_dataset_extraction(self, test_hdf_file):
        """Test dataset data extraction."""
        # Test coordinate dataset extraction
        response = extract_dataset_simple(
            test_hdf_file,
            '/Geometry/Coordinates',
            max_rows=1000
        )

        assert response["success"]
        assert response["data"] is not None
        assert len(response["data"]) == 100  # 100 points
        assert len(response["data"][0]) == 3  # 3D coordinates
        assert response["shape"] == [100, 3]
        assert 'units' in response["attributes"]
        assert response["attributes"]['units'] == 'meters'

        # Test result dataset extraction
        response = extract_dataset_simple(
            test_hdf_file,
            '/Results/Water_Depth',
            max_rows=1000
        )

        assert response["success"]
        assert response["data"] is not None
        assert len(response["data"]) == 100  # 100 values
        assert len(response["data"][0]) == 1  # 1D data
        assert 'units' in response["attributes"]
        assert response["attributes"]['units'] == 'meters'
    
    def test_dataset_extraction_truncation(self, test_hdf_file):
        """Test dataset extraction with row limits."""
        response = extract_dataset_simple(
            test_hdf_file,
            '/Geometry/Coordinates',
            max_rows=50  # Limit to 50 rows
        )

        assert response["success"]
        assert response["data"] is not None
        assert len(response["data"]) == 50  # Should be truncated
        assert response["is_truncated"]
        assert response["total_rows"] == 100  # Original size
    
    def test_result_dataset_detection(self, test_hdf_file):
        """Test automatic detection of result datasets."""
        result_datasets = detect_result_datasets(test_hdf_file)

        # Should detect datasets with 'depth', 'velocity', etc. in names
        all_results = []
        for category in result_datasets.values():
            all_results.extend(category)

        assert len(all_results) > 0
        dataset_names = [name.lower() for name in all_results]
        assert any('depth' in name for name in dataset_names)
        assert any('velocity' in name for name in dataset_names)

    def test_mesh_dataset_detection(self, test_hdf_file):
        """Test automatic detection of mesh datasets."""
        mesh_datasets = detect_mesh_datasets(test_hdf_file)

        # Should detect coordinate and connectivity datasets
        all_mesh = []
        for category in mesh_datasets.values():
            all_mesh.extend(category)

        assert len(all_mesh) > 0
        dataset_names = [name.lower() for name in all_mesh]
        assert any('coord' in name for name in dataset_names)

    def test_vtk_data_preparation(self, test_hdf_file):
        """Test VTK data preparation."""
        vtk_result = prepare_hdf_for_vtk(test_hdf_file, ['/Geometry/Coordinates', '/Results/Water_Depth'])

        assert vtk_result["success"]
        # Should have some mesh or result data
        assert vtk_result["mesh_data"] is not None or vtk_result["result_data"] is not None
    
    def test_error_handling_nonexistent_file(self):
        """Test error handling for non-existent files."""
        response = analyze_hdf_structure_simple('/nonexistent/file.hdf')
        assert not response["success"]
        assert "error" in response

        response = extract_dataset_simple('/nonexistent/file.hdf', '/some/dataset')
        assert not response["success"]
        assert "error" in response

    def test_error_handling_nonexistent_dataset(self, test_hdf_file):
        """Test error handling for non-existent datasets."""
        response = extract_dataset_simple(test_hdf_file, '/NonExistent/Dataset')
        assert not response["success"]
        assert "error" in response

    def test_attributes_extraction(self, test_hdf_file):
        """Test that attributes are properly extracted."""
        response = extract_dataset_simple(
            test_hdf_file,
            '/Geometry/Coordinates'
        )

        assert response["success"]
        assert 'units' in response["attributes"]
        assert 'description' in response["attributes"]
        assert response["attributes"]['units'] == 'meters'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
