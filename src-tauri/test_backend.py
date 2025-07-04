#!/usr/bin/env python3
"""Simple test script to verify eFlow backend functionality."""

import sys
import os
import asyncio
import tempfile
import traceback

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src-python'))

def test_imports():
    """Test that all modules can be imported."""
    print("🔍 Testing imports...")
    
    try:
        # Test basic imports
        from eFlow.models.base import Greeting, AppInfo, GreetRequest
        from eFlow.models.hdf_models import HdfFileInfo, FolderAnalysisRequest
        print("✅ Models imported successfully")
        
        # Test command imports
        from eFlow.commands.basic_commands import register_basic_commands
        from eFlow.commands.hdf_commands import register_hdf_commands
        print("✅ Commands imported successfully")
        
        # Test utils imports
        from eFlow.utils.hdf_utils import analyze_folder_for_hdf_files
        from eFlow.utils.file_utils import check_file_exists
        print("✅ Utils imported successfully")
        
        # Test main module
        import eFlow
        print("✅ Main eFlow module imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        traceback.print_exc()
        return False


def test_models():
    """Test Pydantic models."""
    print("\n🔍 Testing Pydantic models...")
    
    try:
        from eFlow.models.base import Greeting, AppInfo, GreetRequest
        from eFlow.models.hdf_models import HdfFileInfo, FolderAnalysisRequest
        
        # Test GreetRequest
        request = GreetRequest(name="Test User")
        assert request.name == "Test User"
        print("✅ GreetRequest model works")
        
        # Test Greeting
        greeting = Greeting(root="Hello, World!")
        assert greeting.root == "Hello, World!"
        print("✅ Greeting model works")
        
        # Test AppInfo
        app_info = AppInfo(name="eFlow", version="0.1.0", description="Test")
        assert app_info.name == "eFlow"
        print("✅ AppInfo model works")
        
        # Test HdfFileInfo
        file_info = HdfFileInfo(
            filename="test.hdf",
            full_path="/path/test.hdf",
            size=1024,
            is_hdf=True,
            can_process=True
        )
        assert file_info.filename == "test.hdf"
        print("✅ HdfFileInfo model works")
        
        # Test FolderAnalysisRequest
        folder_request = FolderAnalysisRequest(folder_path="/test/path")
        assert folder_request.folder_path == "/test/path"
        print("✅ FolderAnalysisRequest model works")
        
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        traceback.print_exc()
        return False


async def test_basic_commands():
    """Test basic commands."""
    print("\n🔍 Testing basic commands...")
    
    try:
        from pytauri import Commands
        from eFlow.commands.basic_commands import register_basic_commands
        from eFlow.models.base import GreetRequest
        
        # Create commands instance
        commands = Commands()
        register_basic_commands(commands)
        print("✅ Basic commands registered")
        
        # Test greet command
        greet_handler = commands._commands.get("greet")
        if greet_handler:
            request = GreetRequest(name="Test User")
            result = await greet_handler(request)
            assert "Test User" in result.root
            print("✅ Greet command works")
        
        # Test get_app_info command
        app_info_handler = commands._commands.get("get_app_info")
        if app_info_handler:
            result = await app_info_handler()
            assert result.name == "eFlow"
            print("✅ Get app info command works")
        
        # Test ras commander status
        ras_status_handler = commands._commands.get("check_ras_commander_status")
        if ras_status_handler:
            result = await ras_status_handler()
            assert hasattr(result, 'available')
            print("✅ RAS Commander status command works")
        
        return True
        
    except Exception as e:
        print(f"❌ Basic commands test failed: {e}")
        traceback.print_exc()
        return False


async def test_hdf_commands():
    """Test HDF commands."""
    print("\n🔍 Testing HDF commands...")
    
    try:
        from pytauri import Commands
        from eFlow.commands.hdf_commands import register_hdf_commands
        from eFlow.models.hdf_models import FolderAnalysisRequest
        
        # Create commands instance
        commands = Commands()
        register_hdf_commands(commands)
        print("✅ HDF commands registered")
        
        # Test analyze_folder command with non-existent path
        analyze_handler = commands._commands.get("analyze_folder")
        if analyze_handler:
            request = FolderAnalysisRequest(folder_path="/nonexistent/path")
            result = await analyze_handler(request)
            assert result.error is not None
            print("✅ Analyze folder command works (error handling)")
        
        # Test with temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            request = FolderAnalysisRequest(folder_path=temp_dir)
            result = await analyze_handler(request)
            assert result.total_files == 0
            assert result.error is None
            print("✅ Analyze folder command works (empty directory)")
        
        return True
        
    except Exception as e:
        print(f"❌ HDF commands test failed: {e}")
        traceback.print_exc()
        return False


def test_utils():
    """Test utility functions."""
    print("\n🔍 Testing utility functions...")
    
    try:
        from eFlow.utils.file_utils import check_file_exists, get_file_size
        from eFlow.utils.hdf_utils import analyze_folder_for_hdf_files, get_ras_commander_status
        
        # Test file utils
        assert check_file_exists("/nonexistent/file") is False
        print("✅ check_file_exists works")
        
        assert get_file_size("/nonexistent/file") == 0
        print("✅ get_file_size works")
        
        # Test HDF utils
        result = analyze_folder_for_hdf_files("/nonexistent/path")
        assert result.error is not None
        print("✅ analyze_folder_for_hdf_files works")
        
        status = get_ras_commander_status()
        assert hasattr(status, 'available')
        print("✅ get_ras_commander_status works")
        
        return True
        
    except Exception as e:
        print(f"❌ Utils test failed: {e}")
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("🚀 Starting eFlow Backend Tests")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Models", test_models),
        ("Basic Commands", test_basic_commands),
        ("HDF Commands", test_hdf_commands),
        ("Utils", test_utils),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} tests...")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your backend is working correctly.")
        return 0
    else:
        print("💥 Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test runner crashed: {e}")
        traceback.print_exc()
        sys.exit(1)
