"""
Prueba rápida del HEC-RAS Explorer
Verifica que todas las funcionalidades básicas funcionen
"""

import os
import sys
import tempfile
import json
from pathlib import Path


def test_imports():
    """Prueba las importaciones"""
    print("🧪 Probando importaciones...")
    
    try:
        from hecras_explorer import HECRASExplorer
        print("✅ HECRASExplorer importado")
        
        from backend_cli import BackendCLI
        print("✅ BackendCLI importado")
        
        import h5py
        import numpy
        import tabulate
        print("✅ Dependencias disponibles")
        
        return True
        
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        return False


def test_explorer_basic():
    """Prueba funcionalidades básicas del explorador"""
    print("\n🔍 Probando explorador básico...")
    
    try:
        from hecras_explorer import HECRASExplorer
        
        explorer = HECRASExplorer()
        
        # Probar búsqueda en directorio actual
        current_dir = "."
        files = explorer.find_hdf_files(current_dir)
        print(f"✅ Búsqueda de archivos: {len(files)} archivos encontrados")
        
        # Si hay archivos, probar análisis
        if files:
            test_file = files[0]
            print(f"📁 Probando con: {Path(test_file).name}")
            
            # Información básica
            info = explorer.get_file_info(test_file)
            print(f"✅ Información del archivo: {info['size_mb']:.2f} MB")
            
            # Estructura
            structure = explorer.explore_structure(test_file, max_depth=2)
            print(f"✅ Estructura: {structure['total_groups']} grupos, {structure['total_datasets']} datasets")
            
            # Datos HEC-RAS
            hecras_data = explorer.extract_hecras_data(test_file)
            found_data = sum(1 for status in hecras_data['extraction_summary'].values() if status == "Found")
            print(f"✅ Extracción HEC-RAS: {found_data} tipos de datos encontrados")
            
        else:
            print("ℹ️ No hay archivos HDF5 para probar")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba básica: {e}")
        return False


def test_backend_cli():
    """Prueba el CLI del backend"""
    print("\n🖥️ Probando Backend CLI...")
    
    try:
        from backend_cli import BackendCLI
        
        cli = BackendCLI()
        
        # Probar búsqueda
        result = cli.find_files(".")
        print(f"✅ CLI find: {result['success']}, {result.get('count', 0)} archivos")
        
        # Si hay archivos, probar análisis
        if result['success'] and result.get('files'):
            test_file = result['files'][0]['path']
            
            # Probar análisis
            analysis = cli.analyze_file(test_file)
            print(f"✅ CLI analyze: {analysis['success']}")
            
            # Probar estructura
            structure = cli.get_structure_tree(test_file)
            print(f"✅ CLI structure: {structure['success']}")
            
            # Probar datasets
            datasets = cli.get_datasets_list(test_file, limit=10)
            print(f"✅ CLI datasets: {datasets['success']}, {datasets.get('showing', 0)} datasets")
            
            # Probar extracción HEC-RAS
            hecras = cli.extract_hecras_specific(test_file)
            print(f"✅ CLI hecras: {hecras['success']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba CLI: {e}")
        return False


def test_json_output():
    """Prueba la salida JSON"""
    print("\n📄 Probando salida JSON...")
    
    try:
        from backend_cli import BackendCLI
        
        cli = BackendCLI()
        
        # Buscar archivos
        result = cli.find_files(".")
        
        # Probar serialización JSON
        json_str = json.dumps(result, indent=2, ensure_ascii=False)
        print(f"✅ JSON serializable: {len(json_str)} caracteres")
        
        # Probar deserialización
        parsed = json.loads(json_str)
        print(f"✅ JSON parseable: {parsed['success']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba JSON: {e}")
        return False


def create_sample_hdf5():
    """Crea un archivo HDF5 de muestra para pruebas"""
    print("\n🔧 Creando archivo HDF5 de muestra...")
    
    try:
        import h5py
        import numpy as np
        
        # Crear archivo temporal
        temp_file = "sample_test.hdf"
        
        with h5py.File(temp_file, 'w') as f:
            # Metadatos
            f.attrs['File Type'] = 'HEC-RAS Results'
            f.attrs['Version'] = '6.0'
            f.attrs['Created'] = 'Test'
            
            # Crear grupos de ejemplo
            geometry = f.create_group('Geometry')
            results = f.create_group('Results')
            
            # Datos de ejemplo
            mesh_group = geometry.create_group('2D Flow Areas')
            area1 = mesh_group.create_group('Area1')
            
            # Coordenadas de nodos
            coords = area1.create_dataset('Cells Center Coordinate', 
                                        data=np.random.rand(100, 2))
            
            # Resultados de ejemplo
            output_group = results.create_group('Unsteady')
            wse_data = output_group.create_dataset('Water Surface', 
                                                 data=np.random.rand(100, 10))
            
        print(f"✅ Archivo de muestra creado: {temp_file}")
        return temp_file
        
    except Exception as e:
        print(f"❌ Error creando archivo de muestra: {e}")
        return None


def cleanup_test_files():
    """Limpia archivos de prueba"""
    test_files = ["sample_test.hdf", "test_output.json"]
    
    for file in test_files:
        if os.path.exists(file):
            try:
                os.remove(file)
                print(f"🧹 Limpiado: {file}")
            except Exception as e:
                print(f"⚠️ No se pudo limpiar {file}: {e}")


def main():
    """Función principal de pruebas"""
    print("🚀 HEC-RAS Explorer - Prueba Rápida")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Prueba de importaciones
    if not test_imports():
        all_tests_passed = False
    
    # Crear archivo de muestra si no hay archivos HDF5
    sample_file = None
    from hecras_explorer import HECRASExplorer
    explorer = HECRASExplorer()
    existing_files = explorer.find_hdf_files(".")
    
    if not existing_files:
        print("\nℹ️ No se encontraron archivos HDF5, creando archivo de muestra...")
        sample_file = create_sample_hdf5()
    
    # Pruebas funcionales
    if not test_explorer_basic():
        all_tests_passed = False
    
    if not test_backend_cli():
        all_tests_passed = False
    
    if not test_json_output():
        all_tests_passed = False
    
    # Limpiar archivos de prueba
    if sample_file:
        cleanup_test_files()
    
    # Resultado final
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("\nEl HEC-RAS Explorer está listo para usar:")
        print("  • CLI interactivo: python cli_app.py")
        print("  • Backend CLI: python backend_cli.py --help")
        print("  • Ejemplos: python example_usage.py")
    else:
        print("❌ Algunas pruebas fallaron")
        print("Revisa los errores anteriores y verifica la instalación")
    
    return all_tests_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
