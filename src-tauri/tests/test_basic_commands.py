"""Tests for basic commands."""

import pytest
import asyncio
import sys
import os

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

from pytauri import Commands
from eFlow.commands.basic_commands import register_basic_commands
from eFlow.models.base import GreetRequest, Greeting, AppInfo
from eFlow.models.hdf_models import RasCommanderStatus


class TestBasicCommands:
    """Test basic command functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.commands = Commands()
        register_basic_commands(self.commands)

    @pytest.mark.asyncio
    async def test_greet_command(self):
        """Test the greet command."""
        # Create a test request
        request = GreetRequest(name="Test User")
        
        # Get the command handler
        handler = self.commands._commands.get("greet")
        assert handler is not None, "Greet command should be registered"
        
        # Execute the command
        result = await handler(request)
        
        # Verify the result
        assert isinstance(result, Greeting)
        assert "Test User" in result.root
        assert result.root == "Hello, Test User!"

    @pytest.mark.asyncio
    async def test_greet_command_empty_name(self):
        """Test the greet command with empty name."""
        request = GreetRequest(name="")
        handler = self.commands._commands.get("greet")
        
        result = await handler(request)
        
        assert isinstance(result, Greeting)
        assert result.root == "Hello, !"

    @pytest.mark.asyncio
    async def test_greet_command_special_characters(self):
        """Test the greet command with special characters."""
        request = GreetRequest(name="José María")
        handler = self.commands._commands.get("greet")
        
        result = await handler(request)
        
        assert isinstance(result, Greeting)
        assert "José María" in result.root

    @pytest.mark.asyncio
    async def test_get_app_info_command(self):
        """Test the get_app_info command."""
        handler = self.commands._commands.get("get_app_info")
        assert handler is not None, "get_app_info command should be registered"
        
        # Execute the command (no parameters needed)
        result = await handler()
        
        # Verify the result
        assert isinstance(result, AppInfo)
        assert result.name == "eFlow"
        assert result.version == "0.1.0"
        assert "HDF5 Analysis" in result.description

    @pytest.mark.asyncio
    async def test_check_ras_commander_status_command(self):
        """Test the check_ras_commander_status command."""
        handler = self.commands._commands.get("check_ras_commander_status")
        assert handler is not None, "check_ras_commander_status command should be registered"
        
        # Execute the command
        result = await handler()
        
        # Verify the result
        assert isinstance(result, RasCommanderStatus)
        assert isinstance(result.available, bool)
        assert isinstance(result.message, str)
        
        # If available, should have version
        if result.available:
            assert result.version is not None
            assert isinstance(result.version, str)
        else:
            # If not available, version might be None
            assert "not available" in result.message.lower() or "not found" in result.message.lower()

    def test_commands_registration(self):
        """Test that all basic commands are properly registered."""
        expected_commands = ["greet", "get_app_info", "check_ras_commander_status"]
        
        for command_name in expected_commands:
            assert command_name in self.commands._commands, f"Command {command_name} should be registered"
            assert callable(self.commands._commands[command_name]), f"Command {command_name} should be callable"


class TestCommandsIntegration:
    """Test commands integration and error handling."""

    def setup_method(self):
        """Set up test fixtures."""
        self.commands = Commands()
        register_basic_commands(self.commands)

    @pytest.mark.asyncio
    async def test_command_with_invalid_input_type(self):
        """Test command behavior with invalid input types."""
        handler = self.commands._commands.get("greet")
        
        # This should raise an error or handle gracefully
        with pytest.raises((TypeError, ValueError, AttributeError)):
            await handler("invalid_input_not_a_model")

    @pytest.mark.asyncio
    async def test_multiple_commands_execution(self):
        """Test executing multiple commands in sequence."""
        # Execute greet command
        greet_handler = self.commands._commands.get("greet")
        greet_request = GreetRequest(name="Test")
        greet_result = await greet_handler(greet_request)
        
        # Execute app info command
        app_info_handler = self.commands._commands.get("get_app_info")
        app_info_result = await app_info_handler()
        
        # Execute ras commander status
        ras_status_handler = self.commands._commands.get("check_ras_commander_status")
        ras_status_result = await ras_status_handler()
        
        # Verify all results
        assert isinstance(greet_result, Greeting)
        assert isinstance(app_info_result, AppInfo)
        assert isinstance(ras_status_result, RasCommanderStatus)

    @pytest.mark.asyncio
    async def test_concurrent_commands_execution(self):
        """Test executing commands concurrently."""
        # Create multiple greet requests
        requests = [GreetRequest(name=f"User{i}") for i in range(5)]
        greet_handler = self.commands._commands.get("greet")
        
        # Execute concurrently
        tasks = [greet_handler(req) for req in requests]
        results = await asyncio.gather(*tasks)
        
        # Verify all results
        assert len(results) == 5
        for i, result in enumerate(results):
            assert isinstance(result, Greeting)
            assert f"User{i}" in result.root


if __name__ == "__main__":
    pytest.main([__file__])
