# eFlow Backend Tests

Esta carpeta contiene la suite completa de tests para el backend de Python de eFlow.

## Estructura de Tests

```
tests/
├── __init__.py                 # Inicialización del paquete de tests
├── conftest.py                 # Configuración y fixtures de pytest
├── test_models.py              # Tests para modelos Pydantic
├── test_basic_commands.py      # Tests para comandos básicos
├── test_hdf_commands.py        # Tests para comandos HDF
├── test_hdf_utils.py          # Tests para utilidades HDF
├── test_integration.py         # Tests de integración completa
└── README.md                   # Este archivo
```

## Tipos de Tests

### 1. Tests de Modelos (`test_models.py`)
- Validación de modelos Pydantic
- Serialización/deserialización
- Validación de tipos de datos
- Manejo de errores de validación

### 2. Tests de Comandos Básicos (`test_basic_commands.py`)
- Comando `greet`
- Comando `get_app_info`
- Comando `check_ras_commander_status`
- Registro de comandos
- Ejecución asíncrona

### 3. Tests de Comandos HDF (`test_hdf_commands.py`)
- Análisis de carpetas
- Estructura de proyectos
- Inicialización de proyectos
- Extracción de datos HDF
- Manejo de errores

### 4. Tests de Utilidades HDF (`test_hdf_utils.py`)
- Análisis de archivos HDF
- Filtrado de archivos p*.hdf
- Verificación de archivos
- Estado de ras-commander

### 5. Tests de Integración (`test_integration.py`)
- Flujos de trabajo completos
- Ejecución concurrente
- Rendimiento
- Importación de módulos

## Ejecutar Tests

### Opción 1: Script personalizado (Recomendado)
```bash
# Instalar dependencias y ejecutar todos los tests
python run_tests.py --install-deps

# Solo tests unitarios
python run_tests.py --unit

# Solo tests de integración
python run_tests.py --integration

# Con reporte de cobertura
python run_tests.py --coverage

# Tests específicos
python run_tests.py --file test_models.py

# Incluir tests lentos
python run_tests.py --slow
```

### Opción 2: Pytest directo
```bash
# Instalar dependencias primero
pip install pytest pytest-asyncio

# Ejecutar todos los tests
pytest

# Tests específicos
pytest tests/test_models.py

# Con marcadores
pytest -m "not slow"
pytest -m "unit"
pytest -m "integration"

# Con cobertura (requiere pytest-cov)
pip install pytest-cov
pytest --cov=eFlow --cov-report=html
```

## Fixtures Disponibles

### `temp_dir`
Directorio temporal para tests individuales.

### `sample_hdf_files`
Archivos HDF de ejemplo para testing:
- Archivos p*.hdf (plan files)
- Otros archivos HDF
- Archivos no-HDF

### `sample_project_structure`
Estructura completa de proyecto HEC-RAS para testing.

### `mock_ras_commander_available/unavailable`
Mocks para simular disponibilidad de ras-commander.

## Marcadores de Tests

- `@pytest.mark.unit` - Tests unitarios
- `@pytest.mark.integration` - Tests de integración
- `@pytest.mark.slow` - Tests que toman más tiempo
- `@pytest.mark.requires_ras_commander` - Tests que requieren ras-commander

## Configuración

La configuración de pytest está en `pytest.ini` e incluye:
- Descubrimiento automático de tests
- Configuración de asyncio
- Filtros de warnings
- Timeouts
- Marcadores personalizados

## Dependencias de Test

```bash
pip install pytest pytest-asyncio
```

Opcional para cobertura:
```bash
pip install pytest-cov
```

## Estructura de Archivos de Test

Cada archivo de test sigue esta estructura:

```python
"""Tests for [component]."""

import pytest
import sys
import os

# Add src-python to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))

from eFlow.module import Component

class TestComponent:
    """Test component functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        pass
    
    @pytest.mark.asyncio
    async def test_async_function(self):
        """Test async functionality."""
        pass
    
    def test_sync_function(self):
        """Test sync functionality."""
        pass
```

## Mejores Prácticas

1. **Aislamiento**: Cada test debe ser independiente
2. **Fixtures**: Usar fixtures para datos de test reutilizables
3. **Mocking**: Mockear dependencias externas (ras-commander, archivos)
4. **Async**: Usar `@pytest.mark.asyncio` para tests asíncronos
5. **Marcadores**: Usar marcadores para categorizar tests
6. **Cleanup**: Limpiar recursos temporales en teardown

## Troubleshooting

### Error: "Module not found"
Asegúrate de que el path esté configurado correctamente:
```python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src-python'))
```

### Error: "pytest not found"
Instala pytest:
```bash
pip install pytest pytest-asyncio
```

### Tests lentos
Excluye tests lentos:
```bash
pytest -m "not slow"
```

### Problemas con ras-commander
Los tests usan mocks por defecto. Para tests reales con ras-commander:
```bash
pip install ras-commander
pytest -m "requires_ras_commander"
```
