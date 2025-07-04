"""eFlow - HDF5 Analysis with RAS Commander.

This package provides functionality for analyzing HDF5 files from HEC-RAS
using ras-commander integration through PyTauri.
"""

# Import main function from ext_mod for backward compatibility
from .ext_mod import main

# Version information
__version__ = "0.1.0"
__author__ = "eFlow Team"
__description__ = "HDF5 Analysis with RAS Commander"

# Export main function
__all__ = ["main"]
