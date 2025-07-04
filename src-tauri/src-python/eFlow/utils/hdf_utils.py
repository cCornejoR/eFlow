"""HDF utility functions using ras-commander."""

import os
from typing import List, Dict, Any, Optional
from pathlib import Path

from ..models.hdf_models import HdfFileInfo, FolderAnalysisResponse, RasCommanderStatus
from .file_utils import filter_p_files, get_all_hdf_files, get_file_size, is_hdf_file

# Try to import ras-commander
try:
    import ras_commander
    RAS_COMMANDER_AVAILABLE = True
    RAS_COMMANDER_VERSION = getattr(ras_commander, '__version__', 'unknown')
except ImportError:
    RAS_COMMANDER_AVAILABLE = False
    RAS_COMMANDER_VERSION = None
    print("Warning: ras-commander library not available")


def get_ras_commander_status() -> RasCommanderStatus:
    """Get the status of ras-commander library."""
    return RasCommanderStatus(
        available=RAS_COMMANDER_AVAILABLE,
        version=RAS_COMMANDER_VERSION,
        message="ras-commander is ready" if RAS_COMMANDER_AVAILABLE else "ras-commander not available"
    )


def initialize_ras_project(project_path: str):
    """Initialize a RAS project using ras-commander."""
    if not RAS_COMMANDER_AVAILABLE:
        return None, "ras-commander not available"

    try:
        # Use init_ras_project function
        ras_prj = ras_commander.init_ras_project(project_path)
        return ras_prj, None
    except Exception as e:
        return None, f"Error initializing project: {str(e)}"


def get_project_info(ras_prj) -> Dict[str, Any]:
    """Get information from an initialized RAS project."""
    if not ras_prj:
        return {}

    try:
        info = {}

        # Check if project is initialized - use correct method name
        if hasattr(ras_prj, 'check_initialized'):
            info['is_initialized'] = ras_prj.check_initialized()
        else:
            info['is_initialized'] = False

        # Get plan entries
        if hasattr(ras_prj, 'get_plan_entries'):
            try:
                plan_entries = ras_prj.get_plan_entries()
                info['plan_entries'] = plan_entries if plan_entries else []
            except Exception:
                info['plan_entries'] = []

        # Get geometry entries
        if hasattr(ras_prj, 'get_geom_entries'):
            try:
                geom_entries = ras_prj.get_geom_entries()
                info['geom_entries'] = geom_entries if geom_entries else []
            except Exception:
                info['geom_entries'] = []

        # Get HDF entries
        if hasattr(ras_prj, 'get_hdf_entries'):
            try:
                hdf_entries = ras_prj.get_hdf_entries()
                info['hdf_entries'] = hdf_entries if hdf_entries else []
            except Exception:
                info['hdf_entries'] = []

        # Get flow entries
        if hasattr(ras_prj, 'get_flow_entries'):
            try:
                flow_entries = ras_prj.get_flow_entries()
                info['flow_entries'] = flow_entries if flow_entries else []
            except Exception:
                info['flow_entries'] = []

        return info
    except Exception as e:
        return {'error': str(e)}


def analyze_folder_for_hdf_files(folder_path: str) -> FolderAnalysisResponse:
    """Analyze a folder for HDF files, with preference for p*.hdf files."""
    try:
        if not os.path.isdir(folder_path):
            return FolderAnalysisResponse(
                folder_path=folder_path,
                total_files=0,
                p_files=[],
                other_hdf_files=[],
                ras_commander_available=RAS_COMMANDER_AVAILABLE,
                error=f"Directory does not exist: {folder_path}"
            )
        
        # Get p*.hdf files (plan files - preferred)
        p_file_paths = filter_p_files(folder_path)
        p_files = []
        
        for file_path in p_file_paths:
            file_info = _create_hdf_file_info(file_path)
            p_files.append(file_info)
        
        # Get other HDF files
        all_hdf_paths = get_all_hdf_files(folder_path)
        other_hdf_files = []
        
        for file_path in all_hdf_paths:
            # Skip if it's already in p_files
            if not any(p_file.full_path == file_path for p_file in p_files):
                file_info = _create_hdf_file_info(file_path)
                other_hdf_files.append(file_info)
        
        total_files = len(p_files) + len(other_hdf_files)
        
        return FolderAnalysisResponse(
            folder_path=folder_path,
            total_files=total_files,
            p_files=p_files,
            other_hdf_files=other_hdf_files,
            ras_commander_available=RAS_COMMANDER_AVAILABLE
        )
        
    except Exception as e:
        return FolderAnalysisResponse(
            folder_path=folder_path,
            total_files=0,
            p_files=[],
            other_hdf_files=[],
            ras_commander_available=RAS_COMMANDER_AVAILABLE,
            error=f"Error analyzing folder: {str(e)}"
        )


def _create_hdf_file_info(file_path: str) -> HdfFileInfo:
    """Create HdfFileInfo for a file."""
    try:
        filename = os.path.basename(file_path)
        size = get_file_size(file_path)
        is_hdf = is_hdf_file(file_path)
        
        # Check if we can process with ras-commander
        can_process = False
        error = None
        
        if RAS_COMMANDER_AVAILABLE and is_hdf:
            try:
                # Try to initialize a RAS project to test if file is valid
                # This is a basic check - more sophisticated validation could be added
                can_process = True
            except Exception as e:
                error = f"Cannot process with ras-commander: {str(e)}"
        elif not RAS_COMMANDER_AVAILABLE:
            error = "ras-commander not available"
        elif not is_hdf:
            error = "Not an HDF file"
        
        return HdfFileInfo(
            filename=filename,
            full_path=file_path,
            size=size,
            is_hdf=is_hdf,
            can_process=can_process,
            error=error
        )
        
    except Exception as e:
        return HdfFileInfo(
            filename=os.path.basename(file_path) if file_path else "unknown",
            full_path=file_path,
            size=0,
            is_hdf=False,
            can_process=False,
            error=f"Error processing file info: {str(e)}"
        )
