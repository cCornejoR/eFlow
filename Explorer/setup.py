"""
Script de configuración para HEC-RAS Explorer
"""

import subprocess
import sys
import os
from pathlib import Path


def install_requirements():
    """Instala las dependencias necesarias"""
    print("📦 Instalando dependencias...")
    
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ])
        print("✅ Dependencias instaladas correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias: {e}")
        return False


def check_python_version():
    """Verifica la versión de Python"""
    print("🐍 Verificando versión de Python...")
    
    if sys.version_info < (3, 7):
        print("❌ Se requiere Python 3.7 o superior")
        print(f"   Versión actual: {sys.version}")
        return False
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True


def test_imports():
    """Prueba las importaciones necesarias"""
    print("🧪 Probando importaciones...")
    
    try:
        import h5py
        print(f"✅ h5py {h5py.version.version}")
    except ImportError:
        print("❌ h5py no disponible")
        return False
    
    try:
        import numpy
        print(f"✅ numpy {numpy.__version__}")
    except ImportError:
        print("❌ numpy no disponible")
        return False
    
    try:
        import tabulate
        print(f"✅ tabulate disponible")
    except ImportError:
        print("❌ tabulate no disponible")
        return False
    
    return True


def create_test_script():
    """Crea un script de prueba simple"""
    test_script = Path(__file__).parent / "test_installation.py"
    
    test_content = '''"""
Script de prueba para verificar la instalación
"""

def test_explorer():
    """Prueba básica del explorador"""
    try:
        from hecras_explorer import HECRASExplorer
        
        explorer = HECRASExplorer()
        print("✅ HECRASExplorer importado correctamente")
        
        # Probar métodos básicos
        test_path = "."
        files = explorer.find_hdf_files(test_path)
        print(f"✅ Búsqueda de archivos funciona (encontrados: {len(files)})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error probando explorador: {e}")
        return False


if __name__ == "__main__":
    print("🧪 Probando instalación de HEC-RAS Explorer...")
    
    if test_explorer():
        print("\\n🎉 ¡Instalación verificada correctamente!")
        print("\\nPuedes ejecutar:")
        print("  python cli_app.py")
        print("  python example_usage.py")
    else:
        print("\\n❌ Hay problemas con la instalación")
'''
    
    with open(test_script, 'w', encoding='utf-8') as f:
        f.write(test_content)
    
    print(f"✅ Script de prueba creado: {test_script}")


def main():
    """Función principal de configuración"""
    print("🚀 Configurando HEC-RAS Explorer")
    print("=" * 40)
    
    # Verificar Python
    if not check_python_version():
        return False
    
    # Instalar dependencias
    if not install_requirements():
        return False
    
    # Probar importaciones
    if not test_imports():
        print("❌ Algunas dependencias no se instalaron correctamente")
        return False
    
    # Crear script de prueba
    create_test_script()
    
    print("\n🎉 ¡Configuración completada!")
    print("\nPróximos pasos:")
    print("1. Ejecutar prueba: python test_installation.py")
    print("2. Usar CLI: python cli_app.py")
    print("3. Ver ejemplos: python example_usage.py")
    
    return True


if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
