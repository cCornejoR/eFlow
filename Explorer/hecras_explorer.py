"""
HEC-RAS HDF5 File Explorer
Automatiza la lectura y extracción de datos clave de archivos HEC-RAS HDF5
"""

import os
import h5py
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import json
from datetime import datetime


class HECRASExplorer:
    """Clase principal para explorar y extraer datos de archivos HEC-RAS HDF5"""
    
    def __init__(self):
        self.hdf_file_path: Optional[str] = None
        self.data_cache: Dict[str, Any] = {}
        self.structure_cache: Dict[str, Any] = {}
        
    def find_hdf_files(self, project_folder: str) -> List[str]:
        """Busca todos los archivos .hdf en la carpeta del proyecto HEC-RAS"""
        hdf_files = []
        project_path = Path(project_folder)
        
        if not project_path.exists():
            raise FileNotFoundError(f"La carpeta {project_folder} no existe")
            
        # Buscar archivos .hdf recursivamente
        for hdf_file in project_path.rglob("*.hdf"):
            hdf_files.append(str(hdf_file))
            
        return hdf_files
    
    def get_file_info(self, hdf_file: str) -> Dict[str, Any]:
        """Obtiene información básica del archivo HDF5"""
        file_path = Path(hdf_file)
        info = {
            'name': file_path.name,
            'path': str(file_path),
            'size_mb': file_path.stat().st_size / (1024 * 1024),
            'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
            'accessible': True,
            'groups_count': 0,
            'datasets_count': 0
        }
        
        try:
            with h5py.File(hdf_file, 'r') as f:
                def count_items(name, obj):
                    if isinstance(obj, h5py.Group):
                        info['groups_count'] += 1
                    elif isinstance(obj, h5py.Dataset):
                        info['datasets_count'] += 1
                        
                f.visititems(count_items)
        except Exception as e:
            info['accessible'] = False
            info['error'] = str(e)
            
        return info
    
    def explore_structure(self, hdf_file: str, max_depth: int = 10) -> Dict[str, Any]:
        """Explora recursivamente la estructura del archivo HDF5"""
        structure = {
            'file': hdf_file,
            'root': {},
            'total_groups': 0,
            'total_datasets': 0
        }
        
        def build_tree(name, obj, current_dict, depth=0):
            if depth > max_depth:
                return
                
            parts = name.split('/')
            current = current_dict
            
            # Navegar hasta el nivel correcto
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
                    'shape': obj.shape,
                    'dtype': str(obj.dtype),
                    'size': obj.size,
                    'attrs': dict(obj.attrs) if obj.attrs else {}
                }
        
        try:
            with h5py.File(hdf_file, 'r') as f:
                f.visititems(lambda name, obj: build_tree(name, obj, structure['root']))
        except Exception as e:
            structure['error'] = str(e)
            
        return structure
    
    def extract_hecras_data(self, hdf_file: str) -> Dict[str, Any]:
        """Extrae datos clave específicos de HEC-RAS"""
        data = {
            'file': hdf_file,
            'extracted_data': {},
            'metadata': {},
            'extraction_summary': {}
        }
        
        # Rutas comunes en archivos HEC-RAS
        extraction_patterns = {
            'geometry': {
                'mesh_nodes': ['/Geometry/2D Flow Areas/*/Cells Center Coordinate', 
                              '/Geometry/2DMesh/Nodes'],
                'mesh_elements': ['/Geometry/2D Flow Areas/*/Cells FacePoint Indexes',
                                '/Geometry/2DMesh/Elements'],
                'terrain': ['/Geometry/2D Flow Areas/*/Terrain', 
                           '/Geometry/2DTerrain/Elevation']
            },
            'results': {
                'max_wse': ['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/*/Water Surface',
                           '/Results/2D/MaxWSE'],
                'max_velocity': ['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/*/Velocity',
                               '/Results/2D/MaxVelocity'],
                'max_depth': ['/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/*/Depth',
                             '/Results/2D/MaxDepth']
            }
        }
        
        try:
            with h5py.File(hdf_file, 'r') as f:
                # Extraer metadatos generales
                data['metadata'] = {
                    'file_type': f.attrs.get('File Type', 'Unknown'),
                    'version': f.attrs.get('Version', 'Unknown'),
                    'created': f.attrs.get('Created', 'Unknown')
                }
                
                # Buscar y extraer datos según patrones
                for category, subcategories in extraction_patterns.items():
                    data['extracted_data'][category] = {}
                    
                    for data_type, paths in subcategories.items():
                        found = False
                        for path_pattern in paths:
                            # Buscar coincidencias exactas o con wildcards
                            if '*' in path_pattern:
                                # Buscar patrones con wildcards
                                base_path = path_pattern.split('*')[0].rstrip('/')
                                if base_path in f:
                                    for key in f[base_path].keys():
                                        full_path = path_pattern.replace('*', key)
                                        if full_path in f:
                                            dataset = f[full_path]
                                            data['extracted_data'][category][f"{data_type}_{key}"] = {
                                                'path': full_path,
                                                'shape': dataset.shape,
                                                'dtype': str(dataset.dtype),
                                                'size': dataset.size,
                                                'sample_data': self._get_sample_data(dataset)
                                            }
                                            found = True
                            else:
                                if path_pattern in f:
                                    dataset = f[path_pattern]
                                    data['extracted_data'][category][data_type] = {
                                        'path': path_pattern,
                                        'shape': dataset.shape,
                                        'dtype': str(dataset.dtype),
                                        'size': dataset.size,
                                        'sample_data': self._get_sample_data(dataset)
                                    }
                                    found = True
                                    break
                        
                        data['extraction_summary'][f"{category}_{data_type}"] = "Found" if found else "Not Found"
                        
        except Exception as e:
            data['error'] = str(e)
            
        return data
    
    def _get_sample_data(self, dataset: h5py.Dataset, max_samples: int = 10) -> List:
        """Obtiene una muestra de datos del dataset para preview"""
        try:
            if dataset.size == 0:
                return []
            
            # Para datasets pequeños, devolver todo
            if dataset.size <= max_samples:
                return dataset[()].tolist() if hasattr(dataset[()], 'tolist') else [dataset[()]]
            
            # Para datasets grandes, tomar una muestra
            if len(dataset.shape) == 1:
                indices = np.linspace(0, dataset.shape[0]-1, max_samples, dtype=int)
                return dataset[indices].tolist()
            elif len(dataset.shape) == 2:
                # Tomar primeras filas
                sample_rows = min(max_samples, dataset.shape[0])
                return dataset[:sample_rows].tolist()
            else:
                # Para datasets multidimensionales, tomar slice simple
                return dataset.flat[:max_samples].tolist()
                
        except Exception:
            return ["Error reading sample data"]
    
    def get_data_summary(self, hdf_file: str) -> Dict[str, Any]:
        """Genera un resumen completo del archivo HDF5"""
        summary = {
            'file_info': self.get_file_info(hdf_file),
            'structure': self.explore_structure(hdf_file),
            'hecras_data': self.extract_hecras_data(hdf_file)
        }
        
        return summary
    
    def export_structure_to_json(self, hdf_file: str, output_file: str):
        """Exporta la estructura del archivo a JSON"""
        structure = self.explore_structure(hdf_file)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2, ensure_ascii=False)
    
    def list_all_datasets(self, hdf_file: str) -> List[Dict[str, Any]]:
        """Lista todos los datasets con información detallada"""
        datasets = []
        
        try:
            with h5py.File(hdf_file, 'r') as f:
                def collect_datasets(name, obj):
                    if isinstance(obj, h5py.Dataset):
                        datasets.append({
                            'path': f'/{name}',
                            'name': name.split('/')[-1],
                            'shape': obj.shape,
                            'dtype': str(obj.dtype),
                            'size': obj.size,
                            'size_mb': obj.size * obj.dtype.itemsize / (1024 * 1024),
                            'attributes': dict(obj.attrs) if obj.attrs else {}
                        })
                
                f.visititems(collect_datasets)
                
        except Exception as e:
            print(f"Error listing datasets: {e}")
            
        return sorted(datasets, key=lambda x: x['size'], reverse=True)
