"""Tests for HDF utilities."""

import pytest
import os
import tempfile
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

from eFlow.utils.hdf_utils import (
    analyze_folder_for_hdf_files,
    get_ras_commander_status,
    get_all_hdf_files,
    filter_p_files
)
from eFlow.utils.file_utils import (
    check_file_exists,
    get_file_size,
    filter_p_files as file_utils_filter_p_files
)
from eFlow.models.hdf_models import FolderAnalysisResponse, RasCommanderStatus


class TestFileUtils:
    """Test file utility functions."""

    def test_check_file_exists_with_existing_file(self):
        """Test check_file_exists with an existing file."""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            tmp_path = tmp_file.name
            tmp_file.write(b"test content")
        
        try:
            assert check_file_exists(tmp_path) is True
        finally:
            os.unlink(tmp_path)

    def test_check_file_exists_with_nonexistent_file(self):
        """Test check_file_exists with a non-existent file."""
        fake_path = "/path/that/does/not/exist.hdf"
        assert check_file_exists(fake_path) is False

    def test_get_file_size_with_existing_file(self):
        """Test get_file_size with an existing file."""
        test_content = b"test content for size calculation"
        
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            tmp_path = tmp_file.name
            tmp_file.write(test_content)
        
        try:
            size = get_file_size(tmp_path)
            assert size == len(test_content)
        finally:
            os.unlink(tmp_path)

    def test_get_file_size_with_nonexistent_file(self):
        """Test get_file_size with a non-existent file."""
        fake_path = "/path/that/does/not/exist.hdf"
        size = get_file_size(fake_path)
        assert size == 0


class TestHdfUtils:
    """Test HDF utility functions."""

    def setup_method(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

    def teardown_method(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def create_test_file(self, filename, content=b"test"):
        """Helper to create test files."""
        file_path = os.path.join(self.temp_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(content)
        return file_path

    def test_filter_p_files_with_p_files(self):
        """Test filter_p_files with p*.hdf files."""
        # Create test files
        self.create_test_file("p01.hdf")
        self.create_test_file("p02.hdf")
        self.create_test_file("geometry.hdf")
        self.create_test_file("other.txt")
        
        p_files = filter_p_files(self.temp_dir)
        
        assert len(p_files) == 2
        p_filenames = [os.path.basename(f) for f in p_files]
        assert "p01.hdf" in p_filenames
        assert "p02.hdf" in p_filenames
        assert "geometry.hdf" not in p_filenames

    def test_filter_p_files_no_p_files(self):
        """Test filter_p_files with no p*.hdf files."""
        # Create test files without p*.hdf
        self.create_test_file("geometry.hdf")
        self.create_test_file("results.hdf")
        self.create_test_file("other.txt")
        
        p_files = filter_p_files(self.temp_dir)
        
        assert len(p_files) == 0

    def test_filter_p_files_nonexistent_directory(self):
        """Test filter_p_files with non-existent directory."""
        fake_dir = "/path/that/does/not/exist"
        p_files = filter_p_files(fake_dir)
        assert len(p_files) == 0

    def test_get_all_hdf_files(self):
        """Test get_all_hdf_files function."""
        # Create test files
        self.create_test_file("p01.hdf")
        self.create_test_file("geometry.hdf")
        self.create_test_file("results.hdf")
        self.create_test_file("other.txt")
        
        hdf_files = get_all_hdf_files(self.temp_dir)
        
        assert len(hdf_files) == 3
        hdf_filenames = [os.path.basename(f) for f in hdf_files]
        assert "p01.hdf" in hdf_filenames
        assert "geometry.hdf" in hdf_filenames
        assert "results.hdf" in hdf_filenames
        assert "other.txt" not in hdf_filenames

    def test_analyze_folder_for_hdf_files_with_files(self):
        """Test analyze_folder_for_hdf_files with HDF files."""
        # Create test files
        self.create_test_file("p01.hdf", b"plan file content")
        self.create_test_file("p02.hdf", b"another plan file")
        self.create_test_file("geometry.hdf", b"geometry content")
        self.create_test_file("results.hdf", b"results content")
        
        result = analyze_folder_for_hdf_files(self.temp_dir)
        
        assert isinstance(result, FolderAnalysisResponse)
        assert result.folder_path == self.temp_dir
        assert result.total_files == 4
        assert len(result.p_files) == 2
        assert len(result.other_hdf_files) == 2
        assert result.error is None
        
        # Check p_files
        p_filenames = [f.filename for f in result.p_files]
        assert "p01.hdf" in p_filenames
        assert "p02.hdf" in p_filenames
        
        # Check other_hdf_files
        other_filenames = [f.filename for f in result.other_hdf_files]
        assert "geometry.hdf" in other_filenames
        assert "results.hdf" in other_filenames

    def test_analyze_folder_for_hdf_files_empty_folder(self):
        """Test analyze_folder_for_hdf_files with empty folder."""
        result = analyze_folder_for_hdf_files(self.temp_dir)
        
        assert isinstance(result, FolderAnalysisResponse)
        assert result.folder_path == self.temp_dir
        assert result.total_files == 0
        assert len(result.p_files) == 0
        assert len(result.other_hdf_files) == 0
        assert result.error is None

    def test_analyze_folder_for_hdf_files_nonexistent_folder(self):
        """Test analyze_folder_for_hdf_files with non-existent folder."""
        fake_dir = "/path/that/does/not/exist"
        result = analyze_folder_for_hdf_files(fake_dir)
        
        assert isinstance(result, FolderAnalysisResponse)
        assert result.folder_path == fake_dir
        assert result.total_files == 0
        assert len(result.p_files) == 0
        assert len(result.other_hdf_files) == 0
        assert result.error is not None
        assert "does not exist" in result.error

    @patch('eFlow.utils.hdf_utils.RAS_COMMANDER_AVAILABLE', True)
    def test_get_ras_commander_status_available(self):
        """Test get_ras_commander_status when ras-commander is available."""
        with patch('eFlow.utils.hdf_utils.RAS_COMMANDER_VERSION', '1.0.0'):
            status = get_ras_commander_status()
            
            assert isinstance(status, RasCommanderStatus)
            assert status.available is True
            assert status.version == '1.0.0'
            assert 'available' in status.message.lower()

    @patch('eFlow.utils.hdf_utils.RAS_COMMANDER_AVAILABLE', False)
    def test_get_ras_commander_status_unavailable(self):
        """Test get_ras_commander_status when ras-commander is not available."""
        status = get_ras_commander_status()
        
        assert isinstance(status, RasCommanderStatus)
        assert status.available is False
        assert status.version is None
        assert 'not available' in status.message.lower()


class TestHdfUtilsErrorHandling:
    """Test error handling in HDF utilities."""

    @patch('eFlow.utils.hdf_utils.os.path.isdir')
    def test_analyze_folder_exception_handling(self, mock_isdir):
        """Test analyze_folder_for_hdf_files exception handling."""
        # Mock os.path.isdir to raise an exception
        mock_isdir.side_effect = Exception("Simulated error")
        
        result = analyze_folder_for_hdf_files("/some/path")
        
        assert isinstance(result, FolderAnalysisResponse)
        assert result.error is not None
        assert "Error analyzing folder" in result.error
        assert "Simulated error" in result.error


if __name__ == "__main__":
    pytest.main([__file__])
