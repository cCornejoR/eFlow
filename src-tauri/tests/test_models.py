"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError

# Import models from the eFlow package
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

from eFlow.models.base import Greeting, AppInfo, GreetRequest
from eFlow.models.hdf_models import (
    HdfFileInfo,
    FolderAnalysisRequest,
    FolderAnalysisResponse,
    HdfDataRequest,
    HdfDataResponse,
    ProjectStructureRequest,
    ProjectStructureResponse,
    InitializeProjectRequest,
    InitializeProjectResponse,
    HdfFileStructure,
    RasCommanderStatus
)


class TestBaseModels:
    """Test base models."""

    def test_greet_request_valid(self):
        """Test valid GreetRequest creation."""
        request = GreetRequest(name="Test User")
        assert request.name == "Test User"

    def test_greet_request_empty_name(self):
        """Test GreetRequest with empty name."""
        request = GreetRequest(name="")
        assert request.name == ""

    def test_greeting_valid(self):
        """Test valid Greeting creation."""
        greeting = Greeting(root="Hello, World!")
        assert greeting.root == "Hello, World!"

    def test_app_info_valid(self):
        """Test valid AppInfo creation."""
        app_info = AppInfo(
            name="eFlow",
            version="0.1.0",
            description="Test app"
        )
        assert app_info.name == "eFlow"
        assert app_info.version == "0.1.0"
        assert app_info.description == "Test app"


class TestHdfModels:
    """Test HDF-related models."""

    def test_hdf_file_info_valid(self):
        """Test valid HdfFileInfo creation."""
        file_info = HdfFileInfo(
            filename="test.hdf",
            full_path="/path/to/test.hdf",
            size=1024,
            is_hdf=True,
            can_process=True
        )
        assert file_info.filename == "test.hdf"
        assert file_info.full_path == "/path/to/test.hdf"
        assert file_info.size == 1024
        assert file_info.is_hdf is True
        assert file_info.can_process is True
        assert file_info.error is None

    def test_hdf_file_info_with_error(self):
        """Test HdfFileInfo with error."""
        file_info = HdfFileInfo(
            filename="test.hdf",
            full_path="/path/to/test.hdf",
            size=0,
            is_hdf=False,
            can_process=False,
            error="File not found"
        )
        assert file_info.error == "File not found"

    def test_folder_analysis_request_valid(self):
        """Test valid FolderAnalysisRequest."""
        request = FolderAnalysisRequest(folder_path="/test/path")
        assert request.folder_path == "/test/path"

    def test_folder_analysis_response_valid(self):
        """Test valid FolderAnalysisResponse."""
        response = FolderAnalysisResponse(
            folder_path="/test/path",
            total_files=2,
            p_files=[],
            other_hdf_files=[],
            ras_commander_available=True
        )
        assert response.folder_path == "/test/path"
        assert response.total_files == 2
        assert response.ras_commander_available is True
        assert response.error is None

    def test_ras_commander_status_available(self):
        """Test RasCommanderStatus when available."""
        status = RasCommanderStatus(
            available=True,
            version="1.0.0",
            message="Available"
        )
        assert status.available is True
        assert status.version == "1.0.0"
        assert status.message == "Available"

    def test_ras_commander_status_unavailable(self):
        """Test RasCommanderStatus when unavailable."""
        status = RasCommanderStatus(
            available=False,
            message="Not installed"
        )
        assert status.available is False
        assert status.version is None
        assert status.message == "Not installed"

    def test_hdf_file_structure_valid(self):
        """Test valid HdfFileStructure."""
        structure = HdfFileStructure(
            filename="test.hdf",
            file_type="plan",
            size_mb=10.5,
            root_groups=["Results", "Geometry"],
            has_results=True,
            has_geometry=True,
            has_mesh_data=False,
            cell_count=1000
        )
        assert structure.filename == "test.hdf"
        assert structure.file_type == "plan"
        assert structure.size_mb == 10.5
        assert structure.root_groups == ["Results", "Geometry"]
        assert structure.has_results is True
        assert structure.has_geometry is True
        assert structure.has_mesh_data is False
        assert structure.cell_count == 1000


class TestModelValidation:
    """Test model validation errors."""

    def test_hdf_file_info_missing_required_fields(self):
        """Test HdfFileInfo with missing required fields."""
        with pytest.raises(ValidationError):
            HdfFileInfo()  # Missing all required fields

    def test_folder_analysis_request_missing_path(self):
        """Test FolderAnalysisRequest with missing path."""
        with pytest.raises(ValidationError):
            FolderAnalysisRequest()  # Missing folder_path

    def test_invalid_data_types(self):
        """Test models with invalid data types."""
        with pytest.raises(ValidationError):
            HdfFileInfo(
                filename="test.hdf",
                full_path="/path/to/test.hdf",
                size="not_a_number",  # Should be int
                is_hdf=True,
                can_process=True
            )


if __name__ == "__main__":
    pytest.main([__file__])
