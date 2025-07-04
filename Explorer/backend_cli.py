"""
Backend CLI para integración con Tauri
Proporciona funcionalidades del explorador HEC-RAS para el backend
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any
import traceback

# Importar el explorador
from hecras_explorer import HECRASExplorer


class BackendCLI:
    """CLI del backend para integración con Tauri"""
    
    def __init__(self):
        self.explorer = HECRASExplorer()
    
    def find_files(self, project_path: str) -> Dict[str, Any]:
        """Busca archivos HDF5 en el proyecto"""
        try:
            files = self.explorer.find_hdf_files(project_path)
            
            result = {
                'success': True,
                'files': [],
                'count': len(files)
            }
            
            for file_path in files:
                info = self.explorer.get_file_info(file_path)
                result['files'].append({
                    'path': file_path,
                    'name': info['name'],
                    'size_mb': round(info['size_mb'], 2),
                    'accessible': info['accessible'],
                    'groups': info['groups_count'],
                    'datasets': info['datasets_count'],
                    'modified': info['modified']
                })
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analiza un archivo HDF5 específico"""
        try:
            # Información básica
            info = self.explorer.get_file_info(file_path)
            
            # Estructura
            structure = self.explorer.explore_structure(file_path, max_depth=5)
            
            # Datos HEC-RAS
            hecras_data = self.explorer.extract_hecras_data(file_path)
            
            # Datasets principales
            datasets = self.explorer.list_all_datasets(file_path)
            
            result = {
                'success': True,
                'file_info': {
                    'name': info['name'],
                    'path': file_path,
                    'size_mb': round(info['size_mb'], 2),
                    'accessible': info['accessible'],
                    'groups': info['groups_count'],
                    'datasets': info['datasets_count'],
                    'modified': info['modified']
                },
                'structure': {
                    'total_groups': structure['total_groups'],
                    'total_datasets': structure['total_datasets'],
                    'tree': structure['root']
                },
                'hecras_data': {
                    'metadata': hecras_data['metadata'],
                    'extraction_summary': hecras_data['extraction_summary'],
                    'extracted_data': self._simplify_extracted_data(hecras_data['extracted_data'])
                },
                'top_datasets': [
                    {
                        'name': ds['name'],
                        'path': ds['path'],
                        'shape': ds['shape'],
                        'dtype': ds['dtype'],
                        'size_mb': round(ds['size_mb'], 3)
                    }
                    for ds in datasets[:10]
                ]
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def get_structure_tree(self, file_path: str, max_depth: int = 3) -> Dict[str, Any]:
        """Obtiene la estructura en árbol del archivo"""
        try:
            structure = self.explorer.explore_structure(file_path, max_depth)
            
            return {
                'success': True,
                'tree': structure['root'],
                'total_groups': structure['total_groups'],
                'total_datasets': structure['total_datasets']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def get_datasets_list(self, file_path: str, limit: int = 50) -> Dict[str, Any]:
        """Obtiene lista de datasets"""
        try:
            datasets = self.explorer.list_all_datasets(file_path)
            
            result = {
                'success': True,
                'datasets': [
                    {
                        'name': ds['name'],
                        'path': ds['path'],
                        'shape': ds['shape'],
                        'dtype': ds['dtype'],
                        'size': ds['size'],
                        'size_mb': round(ds['size_mb'], 3),
                        'attributes': ds['attributes']
                    }
                    for ds in datasets[:limit]
                ],
                'total_count': len(datasets),
                'showing': min(limit, len(datasets))
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def extract_hecras_specific(self, file_path: str) -> Dict[str, Any]:
        """Extrae solo datos específicos de HEC-RAS"""
        try:
            hecras_data = self.explorer.extract_hecras_data(file_path)
            
            result = {
                'success': True,
                'metadata': hecras_data['metadata'],
                'extraction_summary': hecras_data['extraction_summary'],
                'data_categories': {}
            }
            
            # Organizar datos por categorías
            for category, datasets in hecras_data['extracted_data'].items():
                if datasets:
                    result['data_categories'][category] = {}
                    for name, data in datasets.items():
                        result['data_categories'][category][name] = {
                            'path': data['path'],
                            'shape': data['shape'],
                            'dtype': data['dtype'],
                            'size': data['size'],
                            'has_sample': len(data['sample_data']) > 0
                        }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def _simplify_extracted_data(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simplifica los datos extraídos para JSON"""
        simplified = {}
        
        for category, datasets in extracted_data.items():
            if datasets:
                simplified[category] = {}
                for name, data in datasets.items():
                    simplified[category][name] = {
                        'path': data['path'],
                        'shape': data['shape'],
                        'dtype': data['dtype'],
                        'size': data['size'],
                        'has_sample': len(data['sample_data']) > 0,
                        'sample_preview': data['sample_data'][:3] if data['sample_data'] else []
                    }
        
        return simplified


def main():
    """Función principal del CLI del backend"""
    parser = argparse.ArgumentParser(description='HEC-RAS Explorer Backend CLI')
    parser.add_argument('command', choices=['find', 'analyze', 'structure', 'datasets', 'hecras'],
                       help='Comando a ejecutar')
    parser.add_argument('--path', '-p', required=True, help='Ruta del proyecto o archivo')
    parser.add_argument('--max-depth', type=int, default=3, help='Profundidad máxima para estructura')
    parser.add_argument('--limit', type=int, default=50, help='Límite de resultados')
    parser.add_argument('--output', '-o', help='Archivo de salida JSON')
    
    args = parser.parse_args()
    
    cli = BackendCLI()
    result = {}
    
    try:
        if args.command == 'find':
            result = cli.find_files(args.path)
        elif args.command == 'analyze':
            result = cli.analyze_file(args.path)
        elif args.command == 'structure':
            result = cli.get_structure_tree(args.path, args.max_depth)
        elif args.command == 'datasets':
            result = cli.get_datasets_list(args.path, args.limit)
        elif args.command == 'hecras':
            result = cli.extract_hecras_specific(args.path)
        
        # Salida
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"Resultado guardado en: {args.output}")
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(error_result, f, indent=2, ensure_ascii=False)
        else:
            print(json.dumps(error_result, indent=2, ensure_ascii=False))
        
        sys.exit(1)


if __name__ == "__main__":
    main()
