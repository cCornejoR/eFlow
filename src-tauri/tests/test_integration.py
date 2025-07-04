"""Integration tests for the complete eFlow backend."""

import pytest
import asyncio
import sys
import os

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

from pytauri import Commands
from eFlow.commands.basic_commands import register_basic_commands
from eFlow.commands.hdf_commands import register_hdf_commands
from eFlow.models.base import GreetRequest, AppInfo
from eFlow.models.hdf_models import FolderAnalysisRequest, ProjectStructureRequest


class TestFullIntegration:
    """Test full integration of all commands and functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.commands = Commands()
        register_basic_commands(self.commands)
        register_hdf_commands(self.commands)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_all_commands_registered(self):
        """Test that all expected commands are registered."""
        expected_commands = [
            # Basic commands
            "greet",
            "get_app_info", 
            "check_ras_commander_status",
            # HDF commands
            "analyze_folder",
            "analyze_project_structure",
            "initialize_project",
            "extract_hdf_data"
        ]
        
        for command_name in expected_commands:
            assert command_name in self.commands._commands, f"Command {command_name} should be registered"
            assert callable(self.commands._commands[command_name]), f"Command {command_name} should be callable"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_basic_workflow(self):
        """Test a basic workflow using multiple commands."""
        # 1. Get app info
        app_info_handler = self.commands._commands.get("get_app_info")
        app_info = await app_info_handler()
        
        assert isinstance(app_info, AppInfo)
        assert app_info.name == "eFlow"
        
        # 2. Check ras-commander status
        ras_status_handler = self.commands._commands.get("check_ras_commander_status")
        ras_status = await ras_status_handler()
        
        assert hasattr(ras_status, 'available')
        assert hasattr(ras_status, 'message')
        
        # 3. Greet user
        greet_handler = self.commands._commands.get("greet")
        greet_request = GreetRequest(name="Integration Test")
        greeting = await greet_handler(greet_request)
        
        assert "Integration Test" in greeting.root

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_hdf_analysis_workflow(self, sample_hdf_files):
        """Test HDF analysis workflow."""
        folder_path = os.path.dirname(list(sample_hdf_files.values())[0])
        
        # 1. Analyze folder for HDF files
        analyze_handler = self.commands._commands.get("analyze_folder")
        folder_request = FolderAnalysisRequest(folder_path=folder_path)
        folder_result = await analyze_handler(folder_request)
        
        assert folder_result.total_files > 0
        assert len(folder_result.p_files) >= 0
        assert len(folder_result.other_hdf_files) >= 0
        
        # 2. Analyze project structure
        project_handler = self.commands._commands.get("analyze_project_structure")
        project_request = ProjectStructureRequest(project_path=folder_path)
        project_result = await project_handler(project_request)
        
        assert project_result.project_path == folder_path

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_concurrent_command_execution(self, sample_hdf_files):
        """Test concurrent execution of multiple commands."""
        folder_path = os.path.dirname(list(sample_hdf_files.values())[0])
        
        # Create multiple tasks
        tasks = []
        
        # Add greet tasks
        greet_handler = self.commands._commands.get("greet")
        for i in range(3):
            request = GreetRequest(name=f"User{i}")
            tasks.append(greet_handler(request))
        
        # Add app info tasks
        app_info_handler = self.commands._commands.get("get_app_info")
        tasks.append(app_info_handler())
        tasks.append(app_info_handler())
        
        # Add folder analysis tasks
        analyze_handler = self.commands._commands.get("analyze_folder")
        folder_request = FolderAnalysisRequest(folder_path=folder_path)
        tasks.append(analyze_handler(folder_request))
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify all results
        assert len(results) == 6
        
        # Check greet results
        for i in range(3):
            assert f"User{i}" in results[i].root
        
        # Check app info results
        assert results[3].name == "eFlow"
        assert results[4].name == "eFlow"
        
        # Check folder analysis result
        assert hasattr(results[5], 'total_files')

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_handling_integration(self):
        """Test error handling across different commands."""
        # Test folder analysis with non-existent path
        analyze_handler = self.commands._commands.get("analyze_folder")
        bad_request = FolderAnalysisRequest(folder_path="/nonexistent/path")
        result = await analyze_handler(bad_request)
        
        assert result.error is not None
        assert "does not exist" in result.error
        
        # Test project structure with non-existent path
        project_handler = self.commands._commands.get("analyze_project_structure")
        bad_project_request = ProjectStructureRequest(project_path="/nonexistent/path")
        project_result = await project_handler(bad_project_request)
        
        assert project_result.error is not None
        assert "does not exist" in project_result.error

    @pytest.mark.integration
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_performance_multiple_operations(self, sample_hdf_files):
        """Test performance with multiple operations."""
        import time
        
        folder_path = os.path.dirname(list(sample_hdf_files.values())[0])
        
        start_time = time.time()
        
        # Perform multiple operations
        tasks = []
        
        # Multiple folder analyses
        analyze_handler = self.commands._commands.get("analyze_folder")
        for _ in range(10):
            request = FolderAnalysisRequest(folder_path=folder_path)
            tasks.append(analyze_handler(request))
        
        # Multiple greetings
        greet_handler = self.commands._commands.get("greet")
        for i in range(10):
            request = GreetRequest(name=f"PerfTest{i}")
            tasks.append(greet_handler(request))
        
        # Execute all tasks
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Verify all operations completed
        assert len(results) == 20
        
        # Performance assertion (should complete within reasonable time)
        assert execution_time < 10.0, f"Operations took too long: {execution_time}s"

    @pytest.mark.integration
    def test_command_handler_generation(self):
        """Test that command handlers can be generated properly."""
        # This tests the PyTauri integration aspect
        try:
            # Generate handler (this is what PyTauri would do)
            handler = self.commands.generate_handler(None)  # Portal would be provided by PyTauri
            assert callable(handler)
        except Exception as e:
            # If it fails due to missing portal, that's expected in test environment
            assert "portal" in str(e).lower() or "none" in str(e).lower()


class TestModuleImports:
    """Test that all modules can be imported correctly."""

    @pytest.mark.integration
    def test_all_modules_importable(self):
        """Test that all eFlow modules can be imported."""
        # Test main module
        import eFlow
        assert hasattr(eFlow, 'main')
        
        # Test models
        from eFlow.models import base, hdf_models
        assert hasattr(base, 'Greeting')
        assert hasattr(hdf_models, 'HdfFileInfo')
        
        # Test commands
        from eFlow.commands import basic_commands, hdf_commands
        assert hasattr(basic_commands, 'register_basic_commands')
        assert hasattr(hdf_commands, 'register_hdf_commands')
        
        # Test utils
        from eFlow.utils import hdf_utils, file_utils
        assert hasattr(hdf_utils, 'analyze_folder_for_hdf_files')
        assert hasattr(file_utils, 'check_file_exists')

    @pytest.mark.integration
    def test_ext_mod_importable(self):
        """Test that ext_mod can be imported (PyTauri entry point)."""
        from eFlow import ext_mod
        assert hasattr(ext_mod, 'main')


if __name__ == "__main__":
    pytest.main([__file__])
