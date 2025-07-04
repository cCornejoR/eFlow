#!/usr/bin/env python3
"""Simple test to verify eFlow backend structure."""

import sys
import os

# Add the src-python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src-python'))

def test_basic_imports():
    """Test basic imports without PyTauri dependencies."""
    print("🔍 Testing basic imports...")
    
    try:
        # Test model imports
        from eFlow.models.base import Greeting, AppInfo, GreetRequest
        print("✅ Base models imported successfully")
        
        from eFlow.models.hdf_models import HdfFileInfo, FolderAnalysisRequest
        print("✅ HDF models imported successfully")
        
        # Test utility imports
        from eFlow.utils.file_utils import check_file_exists, get_file_size
        print("✅ File utils imported successfully")
        
        # Test main module
        from eFlow import main
        print("✅ Main function imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_models():
    """Test model functionality."""
    print("\n🔍 Testing models...")
    
    try:
        from eFlow.models.base import Greeting, AppInfo, GreetRequest
        from eFlow.models.hdf_models import HdfFileInfo
        
        # Test GreetRequest
        request = GreetRequest(name="Test User")
        assert request.name == "Test User"
        print("✅ GreetRequest works")
        
        # Test Greeting
        greeting = Greeting("Hello, World!")
        assert greeting.root == "Hello, World!"
        print("✅ Greeting works")
        
        # Test AppInfo
        app_info = AppInfo(name="eFlow", version="0.1.0", description="Test")
        assert app_info.name == "eFlow"
        print("✅ AppInfo works")
        
        # Test HdfFileInfo
        file_info = HdfFileInfo(
            filename="test.hdf",
            full_path="/path/test.hdf",
            size=1024,
            is_hdf=True,
            can_process=True
        )
        assert file_info.filename == "test.hdf"
        print("✅ HdfFileInfo works")
        
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_utils():
    """Test utility functions."""
    print("\n🔍 Testing utilities...")
    
    try:
        from eFlow.utils.file_utils import check_file_exists, get_file_size
        
        # Test with non-existent file
        assert check_file_exists("/nonexistent/file") is False
        print("✅ check_file_exists works")
        
        assert get_file_size("/nonexistent/file") == 0
        print("✅ get_file_size works")
        
        return True
        
    except Exception as e:
        print(f"❌ Utils test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_structure():
    """Test package structure."""
    print("\n🔍 Testing package structure...")
    
    try:
        import eFlow
        assert hasattr(eFlow, 'main')
        print("✅ eFlow package structure is correct")
        
        # Test that ext_mod exists
        from eFlow import ext_mod
        assert hasattr(ext_mod, 'main')
        print("✅ ext_mod is accessible")
        
        return True
        
    except Exception as e:
        print(f"❌ Structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("🚀 eFlow Backend Structure Test")
    print("=" * 40)
    
    tests = [
        ("Basic Imports", test_basic_imports),
        ("Models", test_models),
        ("Utils", test_utils),
        ("Structure", test_structure),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 40)
    print("📊 TEST SUMMARY")
    print("=" * 40)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:15} {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend structure is correct.")
        return 0
    else:
        print("💥 Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test runner crashed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
