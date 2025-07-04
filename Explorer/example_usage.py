"""
Ejemplo de uso del HEC-RAS Explorer
Demuestra cómo usar la librería programáticamente
"""

import os
import json
from pathlib import Path
from hecras_explorer import HECRASExplorer


def example_basic_usage():
    """Ejemplo básico de uso del explorador"""
    print("=== Ejemplo Básico de Uso ===")
    
    # Crear instancia del explorador
    explorer = HECRASExplorer()
    
    # Solicitar ruta del proyecto
    project_path = input("Ingrese la ruta del proyecto HEC-RAS: ").strip()
    
    if not os.path.exists(project_path):
        print(f"❌ La ruta {project_path} no existe")
        return
    
    try:
        # Buscar archivos HDF5
        print(f"\n🔍 Buscando archivos HDF5 en: {project_path}")
        hdf_files = explorer.find_hdf_files(project_path)
        
        if not hdf_files:
            print("❌ No se encontraron archivos HDF5")
            return
        
        print(f"✅ Se encontraron {len(hdf_files)} archivo(s):")
        for i, file_path in enumerate(hdf_files, 1):
            print(f"  {i}. {Path(file_path).name}")
        
        # Usar el primer archivo encontrado
        hdf_file = hdf_files[0]
        print(f"\n📁 Analizando: {Path(hdf_file).name}")
        
        # Obtener información básica
        print("\n📊 Información del archivo:")
        info = explorer.get_file_info(hdf_file)
        for key, value in info.items():
            if key != 'path':  # No mostrar ruta completa
                print(f"  • {key}: {value}")
        
        # Explorar estructura
        print("\n🌳 Explorando estructura...")
        structure = explorer.explore_structure(hdf_file, max_depth=3)
        print(f"  • Total grupos: {structure['total_groups']}")
        print(f"  • Total datasets: {structure['total_datasets']}")
        
        # Extraer datos específicos de HEC-RAS
        print("\n🎯 Extrayendo datos HEC-RAS...")
        hecras_data = explorer.extract_hecras_data(hdf_file)
        
        print("  📋 Metadatos:")
        for key, value in hecras_data['metadata'].items():
            print(f"    • {key}: {value}")
        
        print("  📊 Resumen de extracción:")
        for key, status in hecras_data['extraction_summary'].items():
            status_icon = "✅" if status == "Found" else "❌"
            print(f"    • {key}: {status_icon} {status}")
        
        # Listar datasets más grandes
        print("\n📋 Datasets más grandes:")
        datasets = explorer.list_all_datasets(hdf_file)
        for i, dataset in enumerate(datasets[:5], 1):
            print(f"  {i}. {dataset['name']} - {dataset['size_mb']:.2f} MB")
        
        # Exportar estructura
        output_file = f"{Path(hdf_file).stem}_analysis.json"
        print(f"\n💾 Exportando análisis a: {output_file}")
        
        # Crear resumen completo
        complete_summary = {
            'file_info': info,
            'structure_summary': {
                'total_groups': structure['total_groups'],
                'total_datasets': structure['total_datasets']
            },
            'hecras_extraction': hecras_data['extraction_summary'],
            'top_datasets': datasets[:10]
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(complete_summary, f, indent=2, ensure_ascii=False)
        
        print("✅ Análisis completado exitosamente!")
        
    except Exception as e:
        print(f"❌ Error durante el análisis: {e}")


def example_batch_processing():
    """Ejemplo de procesamiento en lote de múltiples archivos"""
    print("\n=== Ejemplo de Procesamiento en Lote ===")
    
    explorer = HECRASExplorer()
    
    project_path = input("Ingrese la ruta del directorio con proyectos HEC-RAS: ").strip()
    
    if not os.path.exists(project_path):
        print(f"❌ La ruta {project_path} no existe")
        return
    
    try:
        # Buscar todos los archivos HDF5
        all_files = explorer.find_hdf_files(project_path)
        
        if not all_files:
            print("❌ No se encontraron archivos HDF5")
            return
        
        print(f"🔍 Procesando {len(all_files)} archivo(s)...")
        
        batch_results = []
        
        for i, hdf_file in enumerate(all_files, 1):
            print(f"\n📁 [{i}/{len(all_files)}] Procesando: {Path(hdf_file).name}")
            
            try:
                # Análisis rápido
                info = explorer.get_file_info(hdf_file)
                hecras_data = explorer.extract_hecras_data(hdf_file)
                
                result = {
                    'file': Path(hdf_file).name,
                    'path': str(hdf_file),
                    'size_mb': info['size_mb'],
                    'accessible': info['accessible'],
                    'groups': info['groups_count'],
                    'datasets': info['datasets_count'],
                    'hecras_data_found': sum(1 for status in hecras_data['extraction_summary'].values() if status == "Found"),
                    'metadata': hecras_data['metadata']
                }
                
                batch_results.append(result)
                print(f"  ✅ Procesado - {result['hecras_data_found']} tipos de datos encontrados")
                
            except Exception as e:
                print(f"  ❌ Error procesando archivo: {e}")
                batch_results.append({
                    'file': Path(hdf_file).name,
                    'path': str(hdf_file),
                    'error': str(e)
                })
        
        # Guardar resultados del lote
        batch_output = f"batch_analysis_{len(all_files)}_files.json"
        with open(batch_output, 'w', encoding='utf-8') as f:
            json.dump(batch_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Resultados del lote guardados en: {batch_output}")
        
        # Mostrar resumen
        successful = sum(1 for r in batch_results if 'error' not in r)
        total_size = sum(r.get('size_mb', 0) for r in batch_results if 'size_mb' in r)
        
        print(f"\n📊 Resumen del lote:")
        print(f"  • Archivos procesados exitosamente: {successful}/{len(all_files)}")
        print(f"  • Tamaño total: {total_size:.2f} MB")
        print(f"  • Archivos con datos HEC-RAS: {sum(1 for r in batch_results if r.get('hecras_data_found', 0) > 0)}")
        
    except Exception as e:
        print(f"❌ Error en procesamiento en lote: {e}")


def example_detailed_extraction():
    """Ejemplo de extracción detallada de datos específicos"""
    print("\n=== Ejemplo de Extracción Detallada ===")
    
    explorer = HECRASExplorer()
    
    hdf_file = input("Ingrese la ruta completa del archivo HDF5: ").strip()
    
    if not os.path.exists(hdf_file):
        print(f"❌ El archivo {hdf_file} no existe")
        return
    
    try:
        print(f"\n🔍 Análisis detallado de: {Path(hdf_file).name}")
        
        # Obtener resumen completo
        summary = explorer.get_data_summary(hdf_file)
        
        print("\n📊 Información completa:")
        print(f"  • Archivo: {summary['file_info']['name']}")
        print(f"  • Tamaño: {summary['file_info']['size_mb']:.2f} MB")
        print(f"  • Grupos: {summary['structure']['total_groups']}")
        print(f"  • Datasets: {summary['structure']['total_datasets']}")
        
        # Mostrar datos extraídos en detalle
        extracted = summary['hecras_data']['extracted_data']
        
        for category, datasets in extracted.items():
            if datasets:
                print(f"\n🔹 {category.upper()}:")
                for name, data in datasets.items():
                    print(f"  📄 {name}:")
                    print(f"    • Ruta: {data['path']}")
                    print(f"    • Forma: {data['shape']}")
                    print(f"    • Tipo: {data['dtype']}")
                    print(f"    • Tamaño: {data['size']} elementos")
                    
                    if data['sample_data']:
                        sample = data['sample_data'][:3]
                        print(f"    • Muestra: {sample}{'...' if len(data['sample_data']) > 3 else ''}")
        
        # Exportar resumen detallado
        detailed_output = f"{Path(hdf_file).stem}_detailed_analysis.json"
        with open(detailed_output, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Análisis detallado exportado a: {detailed_output}")
        
    except Exception as e:
        print(f"❌ Error en análisis detallado: {e}")


def main():
    """Función principal con menú de ejemplos"""
    print("🚀 HEC-RAS Explorer - Ejemplos de Uso")
    print("=" * 50)
    
    while True:
        print("\nSeleccione un ejemplo:")
        print("1. 📊 Uso básico (análisis de un proyecto)")
        print("2. 📦 Procesamiento en lote (múltiples archivos)")
        print("3. 🔍 Extracción detallada (análisis profundo)")
        print("4. ❌ Salir")
        
        choice = input("\nOpción: ").strip()
        
        if choice == '1':
            example_basic_usage()
        elif choice == '2':
            example_batch_processing()
        elif choice == '3':
            example_detailed_extraction()
        elif choice == '4':
            print("👋 ¡Hasta luego!")
            break
        else:
            print("❌ Opción inválida")
        
        input("\nPresione Enter para continuar...")


if __name__ == "__main__":
    main()
