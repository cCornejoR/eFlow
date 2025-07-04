"""Pytest configuration and fixtures for eFlow tests."""

import pytest
import sys
import os
import tempfile
import shutil
from pathlib import Path

# Add the src-python directory to the path for all tests
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))


@pytest.fixture(scope="session")
def test_data_dir():
    """Create a temporary directory for test data that persists for the session."""
    temp_dir = tempfile.mkdtemp(prefix="eflow_test_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for individual tests."""
    temp_dir = tempfile.mkdtemp(prefix="eflow_test_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_hdf_files(temp_dir):
    """Create sample HDF files for testing."""
    files = {}
    
    # Create p*.hdf files (plan files)
    for i in range(1, 4):
        filename = f"p{i:02d}.hdf"
        filepath = os.path.join(temp_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(b"HDF5 plan file content " + str(i).encode())
        files[f"plan_{i}"] = filepath
    
    # Create other HDF files
    other_files = ["geometry.hdf", "results.hdf", "unsteady.hdf"]
    for filename in other_files:
        filepath = os.path.join(temp_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(b"HDF5 " + filename.encode() + b" content")
        files[filename.replace('.hdf', '')] = filepath
    
    # Create non-HDF files
    non_hdf_files = ["project.prj", "geometry.g01", "flow.f01", "readme.txt"]
    for filename in non_hdf_files:
        filepath = os.path.join(temp_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(b"Non-HDF " + filename.encode() + b" content")
        files[filename.replace('.', '_')] = filepath
    
    return files


@pytest.fixture
def sample_project_structure(temp_dir):
    """Create a sample HEC-RAS project structure for testing."""
    project_files = {
        "project.prj": b"HEC-RAS project file content",
        "geometry.g01": b"Geometry file content",
        "flow.f01": b"Flow file content",
        "plan.p01": b"Plan file content",
        "p01.hdf": b"HDF5 plan results",
        "geometry.hdf": b"HDF5 geometry data",
        "results.hdf": b"HDF5 results data",
        "unsteady.hdf": b"HDF5 unsteady data",
    }
    
    created_files = {}
    for filename, content in project_files.items():
        filepath = os.path.join(temp_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(content)
        created_files[filename] = filepath
    
    return created_files


@pytest.fixture
def mock_ras_commander_available():
    """Mock ras-commander as available for testing."""
    import eFlow.utils.hdf_utils as hdf_utils
    import eFlow.commands.hdf_commands as hdf_commands
    
    # Store original values
    original_available = getattr(hdf_utils, 'RAS_COMMANDER_AVAILABLE', False)
    original_version = getattr(hdf_utils, 'RAS_COMMANDER_VERSION', None)
    original_cmd_available = getattr(hdf_commands, 'RAS_COMMANDER_AVAILABLE', False)
    original_cmd_version = getattr(hdf_commands, 'RAS_COMMANDER_VERSION', None)
    
    # Set mock values
    hdf_utils.RAS_COMMANDER_AVAILABLE = True
    hdf_utils.RAS_COMMANDER_VERSION = "1.0.0"
    hdf_commands.RAS_COMMANDER_AVAILABLE = True
    hdf_commands.RAS_COMMANDER_VERSION = "1.0.0"
    
    yield
    
    # Restore original values
    hdf_utils.RAS_COMMANDER_AVAILABLE = original_available
    hdf_utils.RAS_COMMANDER_VERSION = original_version
    hdf_commands.RAS_COMMANDER_AVAILABLE = original_cmd_available
    hdf_commands.RAS_COMMANDER_VERSION = original_cmd_version


@pytest.fixture
def mock_ras_commander_unavailable():
    """Mock ras-commander as unavailable for testing."""
    import eFlow.utils.hdf_utils as hdf_utils
    import eFlow.commands.hdf_commands as hdf_commands
    
    # Store original values
    original_available = getattr(hdf_utils, 'RAS_COMMANDER_AVAILABLE', False)
    original_version = getattr(hdf_utils, 'RAS_COMMANDER_VERSION', None)
    original_cmd_available = getattr(hdf_commands, 'RAS_COMMANDER_AVAILABLE', False)
    original_cmd_version = getattr(hdf_commands, 'RAS_COMMANDER_VERSION', None)
    
    # Set mock values
    hdf_utils.RAS_COMMANDER_AVAILABLE = False
    hdf_utils.RAS_COMMANDER_VERSION = None
    hdf_commands.RAS_COMMANDER_AVAILABLE = False
    hdf_commands.RAS_COMMANDER_VERSION = None
    
    yield
    
    # Restore original values
    hdf_utils.RAS_COMMANDER_AVAILABLE = original_available
    hdf_utils.RAS_COMMANDER_VERSION = original_version
    hdf_commands.RAS_COMMANDER_AVAILABLE = original_cmd_available
    hdf_commands.RAS_COMMANDER_VERSION = original_cmd_version


# Configure pytest markers
def pytest_configure(config):
    """Configure custom pytest markers."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )


# Configure asyncio for pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Helper function to check if ras-commander is actually available
def is_ras_commander_available():
    """Check if ras-commander is actually available in the environment."""
    try:
        import ras_commander
        return True
    except ImportError:
        return False


# Skip tests that require ras-commander if it's not available
requires_ras_commander = pytest.mark.skipif(
    not is_ras_commander_available(),
    reason="ras-commander not available"
)
