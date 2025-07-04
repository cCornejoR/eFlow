"""File utility functions."""

import os
import glob
from typing import List
from pathlib import Path


def check_file_exists(file_path: str) -> bool:
    """Check if a file exists."""
    return os.path.isfile(file_path)


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0


def filter_p_files(folder_path: str) -> List[str]:
    """Filter for p*.hdf files in a folder (plan files)."""
    pattern = os.path.join(folder_path, "p*.hdf")
    return glob.glob(pattern, recursive=False)


def get_all_hdf_files(folder_path: str) -> List[str]:
    """Get all HDF files in a folder."""
    patterns = ["*.hdf", "*.h5", "*.hdf5"]
    all_files = []
    
    for pattern in patterns:
        full_pattern = os.path.join(folder_path, pattern)
        all_files.extend(glob.glob(full_pattern, recursive=False))
    
    return all_files


def is_hdf_file(file_path: str) -> bool:
    """Check if a file is an HDF file based on extension."""
    ext = Path(file_path).suffix.lower()
    return ext in ['.hdf', '.h5', '.hdf5']
