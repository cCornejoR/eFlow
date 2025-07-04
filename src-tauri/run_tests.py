#!/usr/bin/env python3
"""Script to run eFlow backend tests with different configurations."""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print('='*60)
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"❌ Command not found: {cmd[0]}")
        print("Make sure pytest is installed: pip install pytest pytest-asyncio")
        return False


def main():
    """Main function to run tests."""
    parser = argparse.ArgumentParser(description="Run eFlow backend tests")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--slow", action="store_true", help="Include slow tests")
    parser.add_argument("--coverage", action="store_true", help="Run with coverage report")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--file", "-f", help="Run specific test file")
    parser.add_argument("--install-deps", action="store_true", help="Install test dependencies first")
    
    args = parser.parse_args()
    
    # Change to the src-tauri directory
    src_tauri_dir = Path(__file__).parent
    print(f"Working directory: {src_tauri_dir}")
    
    success = True
    
    # Install dependencies if requested
    if args.install_deps:
        deps_cmd = [sys.executable, "-m", "pip", "install", "pytest", "pytest-asyncio"]
        if args.coverage:
            deps_cmd.append("pytest-cov")
        
        if not run_command(deps_cmd, "Installing test dependencies"):
            return 1
    
    # Build base pytest command
    pytest_cmd = [sys.executable, "-m", "pytest"]
    
    # Add verbosity
    if args.verbose:
        pytest_cmd.append("-v")
    
    # Add coverage if requested
    if args.coverage:
        pytest_cmd.extend([
            "--cov=eFlow",
            "--cov-report=html",
            "--cov-report=term-missing",
            "--cov-report=xml"
        ])
    
    # Determine what tests to run
    if args.file:
        # Run specific file
        test_file = f"tests/{args.file}" if not args.file.startswith("tests/") else args.file
        pytest_cmd.append(test_file)
        description = f"Running tests from {test_file}"
    elif args.unit:
        # Run only unit tests
        pytest_cmd.extend(["-m", "unit"])
        description = "Running unit tests"
    elif args.integration:
        # Run only integration tests
        pytest_cmd.extend(["-m", "integration"])
        description = "Running integration tests"
    else:
        # Run all tests
        if not args.slow:
            pytest_cmd.extend(["-m", "not slow"])
            description = "Running all tests (excluding slow tests)"
        else:
            description = "Running all tests (including slow tests)"
    
    # Run the tests
    if not run_command(pytest_cmd, description):
        success = False
    
    # Summary
    print(f"\n{'='*60}")
    if success:
        print("🎉 All tests completed successfully!")
        if args.coverage:
            print("📊 Coverage report generated in htmlcov/index.html")
    else:
        print("💥 Some tests failed!")
    print('='*60)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
