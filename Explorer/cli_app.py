"""
CLI Application para explorar archivos HEC-RAS HDF5
Aplicación de línea de comandos interactiva
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import json
from tabulate import tabulate
import argparse

# Agregar el directorio actual al path para importar el explorador
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from hecras_explorer import HECRASExplorer


class HECRASCLIApp:
    """Aplicación CLI para explorar archivos HEC-RAS HDF5"""
    
    def __init__(self):
        self.explorer = HECRASExplorer()
        self.current_files: List[str] = []
        self.current_file: str = ""
        
    def print_banner(self):
        """Imprime el banner de la aplicación"""
        banner = """
╔══════════════════════════════════════════════════════════════╗
║                    HEC-RAS HDF5 Explorer                     ║
║              Explorador de archivos HEC-RAS HDF5             ║
╚══════════════════════════════════════════════════════════════╝
        """
        print(banner)
    
    def get_project_path(self) -> str:
        """Solicita al usuario la ruta del proyecto"""
        while True:
            try:
                path = input("\n📁 Ingrese la ruta del proyecto HEC-RAS: ").strip()
                
                # Limpiar la ruta de caracteres especiales que pueden venir del pegado
                path = path.replace('"', '').replace("'", '').strip()
                
                if not path:
                    print("❌ Por favor ingrese una ruta válida")
                    continue
                
                # Expandir variables de entorno y ruta de usuario
                path = os.path.expanduser(os.path.expandvars(path))
                
                if not os.path.exists(path):
                    print(f"❌ La ruta '{path}' no existe")
                    print("💡 Tip: Puede pegar la ruta directamente desde el explorador de archivos")
                    continue
                
                return path
                
            except KeyboardInterrupt:
                print("\n\n👋 ¡Hasta luego!")
                sys.exit(0)
            except Exception as e:
                print(f"❌ Error procesando la ruta: {e}")
                continue
    
    def find_and_display_files(self, project_path: str):
        """Busca y muestra los archivos HDF5 encontrados"""
        try:
            print(f"\n🔍 Buscando archivos HDF5 en: {project_path}")
            self.current_files = self.explorer.find_hdf_files(project_path)
            
            if not self.current_files:
                print("❌ No se encontraron archivos HDF5 en la ruta especificada")
                return False
                
            print(f"\n✅ Se encontraron {len(self.current_files)} archivo(s) HDF5:")
            
            # Crear tabla con información de archivos
            file_data = []
            for i, file_path in enumerate(self.current_files, 1):
                info = self.explorer.get_file_info(file_path)
                file_data.append([
                    i,
                    info['name'],
                    f"{info['size_mb']:.2f} MB",
                    "✅" if info['accessible'] else "❌",
                    info['groups_count'],
                    info['datasets_count']
                ])
            
            headers = ["#", "Archivo", "Tamaño", "Accesible", "Grupos", "Datasets"]
            print(tabulate(file_data, headers=headers, tablefmt="grid"))
            
            return True
            
        except Exception as e:
            print(f"❌ Error buscando archivos: {e}")
            return False
    
    def select_file(self) -> bool:
        """Permite al usuario seleccionar un archivo"""
        if not self.current_files:
            print("❌ No hay archivos disponibles para seleccionar")
            return False
            
        while True:
            try:
                choice = input(f"\n📋 Seleccione un archivo (1-{len(self.current_files)}) o 'q' para salir: ").strip()
                
                if choice.lower() == 'q':
                    return False
                    
                file_index = int(choice) - 1
                if 0 <= file_index < len(self.current_files):
                    self.current_file = self.current_files[file_index]
                    print(f"✅ Archivo seleccionado: {Path(self.current_file).name}")
                    return True
                else:
                    print(f"❌ Selección inválida. Ingrese un número entre 1 y {len(self.current_files)}")
                    
            except ValueError:
                print("❌ Por favor ingrese un número válido")
    
    def show_main_menu(self):
        """Muestra el menú principal de opciones"""
        menu = """
╔══════════════════════════════════════════════════════════════╗
║                        MENÚ PRINCIPAL                        ║
╠══════════════════════════════════════════════════════════════╣
║ 1. 📊 Ver información general del archivo                    ║
║ 2. 🌳 Explorar estructura completa                          ║
║ 3. 🎯 Extraer datos específicos de HEC-RAS                  ║
║ 4. 📋 Listar todos los datasets                             ║
║ 5. 💾 Exportar estructura a JSON                            ║
║ 6. 📁 Cambiar archivo                                       ║
║ 7. 🔄 Cambiar proyecto                                      ║
║ 8. ❌ Salir                                                 ║
╚══════════════════════════════════════════════════════════════╝
        """
        print(menu)
    
    def show_file_info(self):
        """Muestra información general del archivo"""
        print(f"\n📊 Información del archivo: {Path(self.current_file).name}")
        print("=" * 60)
        
        info = self.explorer.get_file_info(self.current_file)
        
        info_table = [
            ["Nombre", info['name']],
            ["Ruta", info['path']],
            ["Tamaño", f"{info['size_mb']:.2f} MB"],
            ["Modificado", info['modified']],
            ["Accesible", "✅ Sí" if info['accessible'] else "❌ No"],
            ["Total Grupos", info['groups_count']],
            ["Total Datasets", info['datasets_count']]
        ]
        
        print(tabulate(info_table, headers=["Propiedad", "Valor"], tablefmt="grid"))
    
    def show_structure(self):
        """Muestra la estructura del archivo en formato árbol"""
        print(f"\n🌳 Estructura del archivo: {Path(self.current_file).name}")
        print("=" * 60)
        
        structure = self.explorer.explore_structure(self.current_file)
        
        if 'error' in structure:
            print(f"❌ Error explorando estructura: {structure['error']}")
            return
        
        print(f"📊 Resumen: {structure['total_groups']} grupos, {structure['total_datasets']} datasets")
        print("\n🌳 Estructura:")
        
        def print_tree(node, prefix="", is_last=True):
            if isinstance(node, dict):
                for i, (key, value) in enumerate(node.items()):
                    is_last_item = i == len(node) - 1
                    current_prefix = "└── " if is_last_item else "├── "
                    
                    if isinstance(value, dict) and 'type' in value:
                        if value['type'] == 'group':
                            print(f"{prefix}{current_prefix}📁 {key}/")
                            next_prefix = prefix + ("    " if is_last_item else "│   ")
                            if 'children' in value:
                                print_tree(value['children'], next_prefix, is_last_item)
                        elif value['type'] == 'dataset':
                            shape_str = f"[{', '.join(map(str, value['shape']))}]" if value['shape'] else "[]"
                            print(f"{prefix}{current_prefix}📄 {key} {shape_str} ({value['dtype']})")
                    else:
                        print(f"{prefix}{current_prefix}📄 {key}")
        
        print_tree(structure['root'])
    
    def extract_hecras_data(self):
        """Extrae y muestra datos específicos de HEC-RAS"""
        print(f"\n🎯 Extrayendo datos HEC-RAS de: {Path(self.current_file).name}")
        print("=" * 60)
        
        data = self.explorer.extract_hecras_data(self.current_file)
        
        if 'error' in data:
            print(f"❌ Error extrayendo datos: {data['error']}")
            return
        
        # Mostrar metadatos
        print("📋 Metadatos del archivo:")
        metadata_table = [[k, v] for k, v in data['metadata'].items()]
        print(tabulate(metadata_table, headers=["Propiedad", "Valor"], tablefmt="grid"))
        
        # Mostrar resumen de extracción
        print("\n📊 Resumen de extracción:")
        summary_table = [[k, v] for k, v in data['extraction_summary'].items()]
        print(tabulate(summary_table, headers=["Tipo de Dato", "Estado"], tablefmt="grid"))
        
        # Mostrar datos extraídos
        print("\n📦 Datos extraídos:")
        for category, datasets in data['extracted_data'].items():
            if datasets:
                print(f"\n🔹 {category.upper()}:")
                for dataset_name, dataset_info in datasets.items():
                    shape_str = f"[{', '.join(map(str, dataset_info['shape']))}]"
                    print(f"  • {dataset_name}: {shape_str} ({dataset_info['dtype']})")
                    print(f"    Ruta: {dataset_info['path']}")
                    if dataset_info['sample_data']:
                        sample_str = str(dataset_info['sample_data'][:3])
                        if len(dataset_info['sample_data']) > 3:
                            sample_str += "..."
                        print(f"    Muestra: {sample_str}")
    
    def list_datasets(self):
        """Lista todos los datasets del archivo"""
        print(f"\n📋 Todos los datasets en: {Path(self.current_file).name}")
        print("=" * 60)
        
        datasets = self.explorer.list_all_datasets(self.current_file)
        
        if not datasets:
            print("❌ No se encontraron datasets en el archivo")
            return
        
        # Crear tabla con información de datasets
        dataset_table = []
        for i, dataset in enumerate(datasets[:20], 1):  # Mostrar solo los primeros 20
            shape_str = f"[{', '.join(map(str, dataset['shape']))}]"
            dataset_table.append([
                i,
                dataset['name'],
                shape_str,
                dataset['dtype'],
                f"{dataset['size_mb']:.3f} MB"
            ])
        
        headers = ["#", "Nombre", "Forma", "Tipo", "Tamaño"]
        print(tabulate(dataset_table, headers=headers, tablefmt="grid"))
        
        if len(datasets) > 20:
            print(f"\n... y {len(datasets) - 20} datasets más")
        
        print(f"\nTotal: {len(datasets)} datasets")
    
    def export_to_json(self):
        """Exporta la estructura a un archivo JSON"""
        output_file = f"{Path(self.current_file).stem}_structure.json"
        
        try:
            self.explorer.export_structure_to_json(self.current_file, output_file)
            print(f"✅ Estructura exportada a: {output_file}")
        except Exception as e:
            print(f"❌ Error exportando: {e}")
    
    def run(self):
        """Ejecuta la aplicación principal"""
        self.print_banner()
        
        while True:
            # Obtener ruta del proyecto
            project_path = self.get_project_path()
            
            # Buscar archivos
            if not self.find_and_display_files(project_path):
                continue
            
            # Seleccionar archivo
            if not self.select_file():
                continue
            
            # Menú principal
            while True:
                self.show_main_menu()
                
                choice = input("Seleccione una opción: ").strip()
                
                if choice == '1':
                    self.show_file_info()
                elif choice == '2':
                    self.show_structure()
                elif choice == '3':
                    self.extract_hecras_data()
                elif choice == '4':
                    self.list_datasets()
                elif choice == '5':
                    self.export_to_json()
                elif choice == '6':
                    if not self.select_file():
                        break
                elif choice == '7':
                    break
                elif choice == '8':
                    print("\n👋 ¡Hasta luego!")
                    return
                else:
                    print("❌ Opción inválida")
                
                input("\nPresione Enter para continuar...")


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='HEC-RAS HDF5 Explorer CLI')
    parser.add_argument('--path', '-p', help='Ruta del proyecto HEC-RAS')
    
    args = parser.parse_args()
    
    app = HECRASCLIApp()
    
    if args.path:
        # Modo no interactivo con ruta proporcionada
        if app.find_and_display_files(args.path):
            if len(app.current_files) == 1:
                app.current_file = app.current_files[0]
                print(f"✅ Archivo seleccionado automáticamente: {Path(app.current_file).name}")
            else:
                app.select_file()
    
    app.run()


if __name__ == "__main__":
    main()
