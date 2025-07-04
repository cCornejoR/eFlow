"""Tests for HDF commands."""

import pytest
import asyncio
import os
import tempfile
import sys
from unittest.mock import patch, MagicMock

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

from pytauri import Commands
from eFlow.commands.hdf_commands import register_hdf_commands
from eFlow.models.hdf_models import (
    FolderAnalysisRequest,
    FolderAnalysisResponse,
    ProjectStructureRequest,
    ProjectStructureResponse,
    InitializeProjectRequest,
    InitializeProjectResponse,
    HdfDataRequest,
    HdfDataResponse
)


class TestHdfCommands:
    """Test HDF command functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.commands = Commands()
        register_hdf_commands(self.commands)
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

    @pytest.mark.asyncio
    async def test_analyze_folder_command_with_hdf_files(self):
        """Test analyze_folder command with HDF files."""
        # Create test files
        self.create_test_file("p01.hdf", b"plan file content")
        self.create_test_file("geometry.hdf", b"geometry content")
        
        # Create request
        request = FolderAnalysisRequest(folder_path=self.temp_dir)
        
        # Get command handler
        handler = self.commands._commands.get("analyze_folder")
        assert handler is not None, "analyze_folder command should be registered"
        
        # Execute command
        result = await handler(request)
        
        # Verify result
        assert isinstance(result, FolderAnalysisResponse)
        assert result.folder_path == self.temp_dir
        assert result.total_files == 2
        assert len(result.p_files) == 1
        assert len(result.other_hdf_files) == 1
        assert result.error is None

    @pytest.mark.asyncio
    async def test_analyze_folder_command_empty_folder(self):
        """Test analyze_folder command with empty folder."""
        request = FolderAnalysisRequest(folder_path=self.temp_dir)
        handler = self.commands._commands.get("analyze_folder")
        
        result = await handler(request)
        
        assert isinstance(result, FolderAnalysisResponse)
        assert result.total_files == 0
        assert len(result.p_files) == 0
        assert len(result.other_hdf_files) == 0

    @pytest.mark.asyncio
    async def test_analyze_folder_command_nonexistent_folder(self):
        """Test analyze_folder command with non-existent folder."""
        fake_path = "/path/that/does/not/exist"
        request = FolderAnalysisRequest(folder_path=fake_path)
        handler = self.commands._commands.get("analyze_folder")
        
        result = await handler(request)
        
        assert isinstance(result, FolderAnalysisResponse)
        assert result.error is not None
        assert "does not exist" in result.error

    @pytest.mark.asyncio
    async def test_analyze_project_structure_command_nonexistent_path(self):
        """Test analyze_project_structure command with non-existent path."""
        fake_path = "/path/that/does/not/exist"
        request = ProjectStructureRequest(project_path=fake_path)
        handler = self.commands._commands.get("analyze_project_structure")
        
        assert handler is not None, "analyze_project_structure command should be registered"
        
        result = await handler(request)
        
        assert isinstance(result, ProjectStructureResponse)
        assert result.project_path == fake_path
        assert result.has_prj_file is False
        assert result.total_hdf_files == 0
        assert result.error is not None
        assert "does not exist" in result.error

    @pytest.mark.asyncio
    async def test_analyze_project_structure_command_with_files(self):
        """Test analyze_project_structure command with project files."""
        # Create test project files
        self.create_test_file("project.prj", b"project file")
        self.create_test_file("geometry.g01", b"geometry file")
        self.create_test_file("p01.hdf", b"plan file")
        self.create_test_file("results.hdf", b"results file")
        
        request = ProjectStructureRequest(project_path=self.temp_dir)
        handler = self.commands._commands.get("analyze_project_structure")
        
        result = await handler(request)
        
        assert isinstance(result, ProjectStructureResponse)
        assert result.project_path == self.temp_dir
        assert result.has_prj_file is True
        assert result.total_hdf_files >= 1  # At least the p01.hdf file

    @pytest.mark.asyncio
    async def test_initialize_project_command_nonexistent_path(self):
        """Test initialize_project command with non-existent path."""
        fake_path = "/path/that/does/not/exist"
        request = InitializeProjectRequest(project_path=fake_path)
        handler = self.commands._commands.get("initialize_project")
        
        assert handler is not None, "initialize_project command should be registered"
        
        result = await handler(request)
        
        assert isinstance(result, InitializeProjectResponse)
        assert result.project_path == fake_path
        assert result.success is False
        assert result.error is not None

    @pytest.mark.asyncio
    async def test_extract_hdf_data_command_nonexistent_file(self):
        """Test extract_hdf_data command with non-existent file."""
        fake_file = "/path/that/does/not/exist.hdf"
        request = HdfDataRequest(file_path=fake_file)
        handler = self.commands._commands.get("extract_hdf_data")
        
        assert handler is not None, "extract_hdf_data command should be registered"
        
        result = await handler(request)
        
        assert isinstance(result, HdfDataResponse)
        assert result.success is False
        assert result.error is not None
        assert "does not exist" in result.error

    @patch('eFlow.commands.hdf_commands.RAS_COMMANDER_AVAILABLE', False)
    @pytest.mark.asyncio
    async def test_extract_hdf_data_command_no_ras_commander(self):
        """Test extract_hdf_data command when ras-commander is not available."""
        # Create a test file
        test_file = self.create_test_file("test.hdf", b"test content")
        
        request = HdfDataRequest(file_path=test_file)
        handler = self.commands._commands.get("extract_hdf_data")
        
        result = await handler(request)
        
        assert isinstance(result, HdfDataResponse)
        assert result.success is False
        assert "ras-commander library not available" in result.error

    def test_hdf_commands_registration(self):
        """Test that all HDF commands are properly registered."""
        expected_commands = [
            "analyze_folder",
            "analyze_project_structure",
            "initialize_project",
            "extract_hdf_data"
        ]
        
        for command_name in expected_commands:
            assert command_name in self.commands._commands, f"Command {command_name} should be registered"
            assert callable(self.commands._commands[command_name]), f"Command {command_name} should be callable"


class TestHdfCommandsIntegration:
    """Test HDF commands integration and error handling."""

    def setup_method(self):
        """Set up test fixtures."""
        self.commands = Commands()
        register_hdf_commands(self.commands)
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

    @pytest.mark.asyncio
    async def test_multiple_folder_analysis(self):
        """Test analyzing multiple folders in sequence."""
        # Create files in first folder
        self.create_test_file("p01.hdf")
        self.create_test_file("geometry.hdf")
        
        # Create second folder
        temp_dir2 = tempfile.mkdtemp()
        try:
            # Analyze first folder
            request1 = FolderAnalysisRequest(folder_path=self.temp_dir)
            handler = self.commands._commands.get("analyze_folder")
            result1 = await handler(request1)
            
            # Analyze second folder (empty)
            request2 = FolderAnalysisRequest(folder_path=temp_dir2)
            result2 = await handler(request2)
            
            # Verify results
            assert result1.total_files == 2
            assert result2.total_files == 0
            
        finally:
            import shutil
            shutil.rmtree(temp_dir2, ignore_errors=True)

    @pytest.mark.asyncio
    async def test_concurrent_folder_analysis(self):
        """Test concurrent folder analysis."""
        # Create test files
        self.create_test_file("p01.hdf")
        self.create_test_file("p02.hdf")
        
        # Create multiple requests
        requests = [
            FolderAnalysisRequest(folder_path=self.temp_dir)
            for _ in range(3)
        ]
        
        handler = self.commands._commands.get("analyze_folder")
        
        # Execute concurrently
        tasks = [handler(req) for req in requests]
        results = await asyncio.gather(*tasks)
        
        # Verify all results
        assert len(results) == 3
        for result in results:
            assert isinstance(result, FolderAnalysisResponse)
            assert result.total_files == 2

    @pytest.mark.asyncio
    async def test_command_with_invalid_input_type(self):
        """Test command behavior with invalid input types."""
        handler = self.commands._commands.get("analyze_folder")
        
        # This should raise an error or handle gracefully
        with pytest.raises((TypeError, ValueError, AttributeError)):
            await handler("invalid_input_not_a_model")


if __name__ == "__main__":
    pytest.main([__file__])
