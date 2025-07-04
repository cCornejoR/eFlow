"""Simple tests for HDF functionality without PyTauri dependencies."""

import pytest
import os
import tempfile
import h5py
import numpy as np
import sys

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

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
        
        # Create connectivity dataset
        connectivity = np.random.randint(0, 100, (50, 4))  # 50 quads
        geometry_group.create_dataset('Connectivity', data=connectivity)
        
        # Create result datasets
        depth_data = np.random.rand(100) * 10  # Depth at each node
        results_group.create_dataset('Water_Depth', data=depth_data)
        results_group['Water_Depth'].attrs['units'] = 'meters'
        
        velocity_data = np.random.rand(100, 2) * 5  # 2D velocity vectors
        results_group.create_dataset('Velocity', data=velocity_data)
        results_group['Velocity'].attrs['units'] = 'm/s'


class TestHdfSimple:
    """Simple HDF functionality tests."""
    
    @pytest.fixture
    def test_hdf_file(self):
        """Create a temporary HDF file for testing."""
        with tempfile.NamedTemporaryFile(suffix='.hdf', delete=False) as tmp:
            create_test_hdf_file(tmp.name)
            yield tmp.name
        os.unlink(tmp.name)
    
    def test_mesh_dataset_detection(self, test_hdf_file):
        """Test detection of mesh datasets."""
        mesh_datasets = detect_mesh_datasets(test_hdf_file)
        
        # Should detect coordinate datasets
        assert len(mesh_datasets["coordinates"]) > 0
        assert any('Coordinates' in path for path in mesh_datasets["coordinates"])
        
        # Should detect connectivity datasets
        assert len(mesh_datasets["connectivity"]) > 0
        assert any('Connectivity' in path for path in mesh_datasets["connectivity"])
    
    def test_result_dataset_detection(self, test_hdf_file):
        """Test detection of result datasets."""
        result_datasets = detect_result_datasets(test_hdf_file)
        
        # Should detect scalar results
        assert len(result_datasets["scalar_results"]) > 0
        assert any('Water_Depth' in path for path in result_datasets["scalar_results"])
        
        # Should detect vector results
        assert len(result_datasets["vector_results"]) > 0
        assert any('Velocity' in path for path in result_datasets["vector_results"])
    
    def test_vtk_data_preparation(self, test_hdf_file):
        """Test VTK data preparation."""
        result = prepare_hdf_for_vtk(test_hdf_file)
        
        assert result["success"]
        # Should detect mesh or result data
        assert result["mesh_data"] is not None or result["result_data"] is not None
        
        if result["mesh_data"]:
            assert "points" in result["mesh_data"]
            assert "metadata" in result["mesh_data"]
    
    def test_hdf_file_reading(self, test_hdf_file):
        """Test basic HDF file reading."""
        with h5py.File(test_hdf_file, 'r') as f:
            # Check groups exist
            assert 'Geometry' in f.keys()
            assert 'Results' in f.keys()
            
            # Check datasets exist
            assert 'Coordinates' in f['Geometry'].keys()
            assert 'Water_Depth' in f['Results'].keys()
            
            # Check data shapes
            coords = f['Geometry/Coordinates']
            assert coords.shape == (100, 3)
            
            depth = f['Results/Water_Depth']
            assert depth.shape == (100,)
    
    def test_dataset_attributes(self, test_hdf_file):
        """Test dataset attribute reading."""
        with h5py.File(test_hdf_file, 'r') as f:
            coords = f['Geometry/Coordinates']
            assert 'units' in coords.attrs
            assert coords.attrs['units'] == 'meters'
            
            depth = f['Results/Water_Depth']
            assert 'units' in depth.attrs
            assert depth.attrs['units'] == 'meters'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
