"""HDF Explorer commands for PyTauri integration."""

import os
import sys
import traceback
import h5py
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
from pytauri import Commands


def register_hdf_explorer_commands(commands: Commands):
    """Register HDF Explorer commands with PyTauri."""

    print("🔧 Registering HDF Explorer commands...")

    @commands.command
    def test_hdf_connection() -> Dict[str, Any]:
        """Test HDF Explorer connection."""
        try:
            return {
                'success': True,
                'message': 'HDF Explorer commands are working!',
                'timestamp': str(datetime.now()),
                'python_version': sys.version,
                'h5py_available': True
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error in test connection'
            }

    @commands.command
    def find_hdf_files(project_path: str) -> Dict[str, Any]:
        """Find all HDF files in a project folder - Direct implementation."""
        try:
            print(f"🔍 Searching for HDF files in: {project_path}")

            # Check if path exists
            if not os.path.exists(project_path):
                return {
                    'success': False,
                    'error': f'Path does not exist: {project_path}',
                    'files': [],
                    'count': 0
                }

            # Find all .hdf files recursively
            hdf_files = []
            project_path_obj = Path(project_path)

            for hdf_file in project_path_obj.rglob("*.hdf"):
                try:
                    file_info = {
                        'path': str(hdf_file),
                        'name': hdf_file.name,
                        'size_mb': hdf_file.stat().st_size / (1024 * 1024),
                        'modified': datetime.fromtimestamp(hdf_file.stat().st_mtime).isoformat(),
                        'accessible': True,
                        'groups': 0,
                        'datasets': 0
                    }

                    # Try to open and count groups/datasets
                    try:
                        with h5py.File(str(hdf_file), 'r') as f:
                            def count_items(name, obj):
                                if isinstance(obj, h5py.Group):
                                    file_info['groups'] += 1
                                elif isinstance(obj, h5py.Dataset):
                                    file_info['datasets'] += 1
                            f.visititems(count_items)
                    except Exception as e:
                        file_info['accessible'] = False
                        file_info['error'] = str(e)

                    hdf_files.append(file_info)
                    print(f"  📄 Found: {hdf_file.name} ({file_info['size_mb']:.2f} MB)")

                except Exception as e:
                    print(f"  ❌ Error processing {hdf_file}: {e}")
                    continue

            result = {
                'success': True,
                'files': hdf_files,
                'count': len(hdf_files),
                'project_path': project_path
            }

            print(f"✅ Found {len(hdf_files)} HDF files total")
            return result

        except Exception as e:
            print(f"❌ Error finding HDF files: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e),
                'files': [],
                'count': 0
            }
    
    @commands.command
    def analyze_hdf_file(file_path: str) -> Dict[str, Any]:
        """Analyze a specific HDF file comprehensively - Direct implementation."""
        try:
            print(f"🔍 Analyzing HDF file: {file_path}")

            # Check if file exists
            if not os.path.exists(file_path):
                return {
                    'success': False,
                    'error': f'File does not exist: {file_path}'
                }

            # Get basic file info
            file_path_obj = Path(file_path)
            file_info = {
                'name': file_path_obj.name,
                'path': file_path,
                'size_mb': file_path_obj.stat().st_size / (1024 * 1024),
                'modified': datetime.fromtimestamp(file_path_obj.stat().st_mtime).isoformat(),
                'accessible': True,
                'groups': 0,
                'datasets': 0
            }

            # Analyze HDF structure
            structure = {
                'total_groups': 0,
                'total_datasets': 0,
                'tree': {}
            }

            # HEC-RAS metadata
            hecras_data = {
                'metadata': {},
                'extraction_summary': {},
                'extracted_data': {}
            }

            # Top datasets
            top_datasets = []

            try:
                with h5py.File(file_path, 'r') as f:
                    # Get metadata
                    hecras_data['metadata'] = {
                        'file_type': f.attrs.get('File Type', 'Unknown'),
                        'version': f.attrs.get('Version', 'Unknown'),
                        'created': f.attrs.get('Created', 'Unknown')
                    }

                    # Count items and collect datasets
                    datasets_list = []

                    def analyze_item(name, obj):
                        if isinstance(obj, h5py.Group):
                            structure['total_groups'] += 1
                            file_info['groups'] += 1
                        elif isinstance(obj, h5py.Dataset):
                            structure['total_datasets'] += 1
                            file_info['datasets'] += 1

                            # Collect dataset info
                            dataset_info = {
                                'name': name.split('/')[-1],
                                'path': f'/{name}',
                                'shape': list(obj.shape),
                                'dtype': str(obj.dtype),
                                'size_mb': obj.size * obj.dtype.itemsize / (1024 * 1024)
                            }
                            datasets_list.append(dataset_info)

                    f.visititems(analyze_item)

                    # Sort datasets by size and get top 10
                    top_datasets = sorted(datasets_list, key=lambda x: x['size_mb'], reverse=True)[:10]

                    print(f"  📊 Found {structure['total_groups']} groups and {structure['total_datasets']} datasets")

            except Exception as e:
                file_info['accessible'] = False
                file_info['error'] = str(e)
                print(f"  ❌ Error reading HDF file: {e}")

            result = {
                'success': True,
                'file_info': file_info,
                'structure': structure,
                'hecras_data': hecras_data,
                'top_datasets': top_datasets
            }

            print(f"✅ Analysis completed successfully")
            return result

        except Exception as e:
            print(f"❌ Error analyzing HDF file: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @commands.command
    def get_hdf_structure_tree(file_path: str, max_depth: int = 3) -> Dict[str, Any]:
        """Get the hierarchical structure of an HDF file."""
        try:
            print(f"🌳 Getting structure tree for: {file_path}")

            if not os.path.exists(file_path):
                return {
                    'success': False,
                    'error': f'File does not exist: {file_path}',
                    'tree': {},
                    'total_groups': 0,
                    'total_datasets': 0
                }

            structure = {
                'tree': {},
                'total_groups': 0,
                'total_datasets': 0
            }

            try:
                with h5py.File(file_path, 'r') as f:
                    def build_tree(name, obj, current_dict, depth=0):
                        if depth > max_depth:
                            return

                        parts = name.split('/')
                        current = current_dict

                        # Navigate to correct level
                        for part in parts[:-1]:
                            if part and part not in current:
                                current[part] = {'type': 'group', 'children': {}}
                            if part:
                                current = current[part]['children']

                        final_name = parts[-1]
                        if isinstance(obj, h5py.Group):
                            structure['total_groups'] += 1
                            current[final_name] = {
                                'type': 'group',
                                'children': {},
                                'attrs': dict(obj.attrs) if obj.attrs else {}
                            }
                        elif isinstance(obj, h5py.Dataset):
                            structure['total_datasets'] += 1
                            current[final_name] = {
                                'type': 'dataset',
                                'shape': list(obj.shape),
                                'dtype': str(obj.dtype),
                                'size': int(obj.size),
                                'attrs': dict(obj.attrs) if obj.attrs else {}
                            }

                    f.visititems(lambda name, obj: build_tree(name, obj, structure['tree']))

            except Exception as e:
                return {
                    'success': False,
                    'error': str(e),
                    'tree': {},
                    'total_groups': 0,
                    'total_datasets': 0
                }

            result = {
                'success': True,
                'tree': structure['tree'],
                'total_groups': structure['total_groups'],
                'total_datasets': structure['total_datasets']
            }

            print(f"✅ Structure tree generated successfully")
            return result

        except Exception as e:
            print(f"❌ Error getting structure tree: {e}")
            return {
                'success': False,
                'error': str(e),
                'tree': {},
                'total_groups': 0,
                'total_datasets': 0
            }
    
    # Simplified commands - removing complex dependencies
    print("✅ Core HDF Explorer commands registered successfully!")

    print("✅ HDF Explorer commands registered successfully!")
