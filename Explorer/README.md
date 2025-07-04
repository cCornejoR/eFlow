# HEC-RAS HDF5 Explorer

Herramienta para explorar y extraer datos de archivos HEC-RAS HDF5 de forma automatizada.

## Características

- 🔍 **Búsqueda automática** de archivos HDF5 en proyectos HEC-RAS
- 🌳 **Exploración de estructura** completa del archivo
- 🎯 **Extracción específica** de datos clave de HEC-RAS (malla, terreno, resultados)
- 📊 **Visualización tabular** de información
- 💾 **Exportación** de estructura a JSON
- 🖥️ **Interfaz CLI** interactiva y amigable

## Instalación

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

## Uso

### Modo Interactivo
```bash
python cli_app.py
```

### Modo con Ruta Específica
```bash
python cli_app.py --path "C:\ruta\a\tu\proyecto\hecras"
```

## Funcionalidades

### 1. Información General
- Tamaño del archivo
- Fecha de modificación
- Número de grupos y datasets
- Estado de accesibilidad

### 2. Exploración de Estructura
- Vista en árbol de la jerarquía HDF5
- Información de tipos de datos
- Dimensiones de arrays

### 3. Extracción de Datos HEC-RAS
Busca automáticamente:
- **Geometría**: Nodos de malla, elementos, terreno
- **Resultados**: Elevaciones máximas, velocidades, tirantes

### 4. Listado de Datasets
- Todos los datasets ordenados por tamaño
- Información detallada de cada dataset
- Muestra de datos para preview

### 5. Exportación
- Estructura completa a JSON
- Metadatos preservados
- Formato legible

## Estructura de Datos Extraídos

### Geometría
- `mesh_nodes`: Coordenadas de nodos de la malla
- `mesh_elements`: Índices de elementos de la malla
- `terrain`: Datos de elevación del terreno

### Resultados
- `max_wse`: Elevaciones máximas de superficie de agua
- `max_velocity`: Velocidades máximas
- `max_depth`: Tirantes máximos

## Ejemplo de Uso Programático

```python
from hecras_explorer import HECRASExplorer

# Crear explorador
explorer = HECRASExplorer()

# Buscar archivos HDF5
files = explorer.find_hdf_files("C:/proyecto_hecras")

# Obtener resumen completo
summary = explorer.get_data_summary(files[0])

# Extraer datos específicos
data = explorer.extract_hecras_data(files[0])
```

## Rutas Comunes en HEC-RAS

### Geometría
- `/Geometry/2D Flow Areas/*/Cells Center Coordinate`
- `/Geometry/2DMesh/Nodes`
- `/Geometry/2DTerrain/Elevation`

### Resultados
- `/Results/Unsteady/Output/Output Blocks/Base Output/Unsteady Time Series/2D Flow Areas/*/Water Surface`
- `/Results/2D/MaxWSE`
- `/Results/2D/MaxVelocity`

## Notas Importantes

1. **Compatibilidad**: Funciona con archivos HEC-RAS 5.x y 6.x
2. **Rendimiento**: Para archivos grandes (>1GB), la exploración puede tomar tiempo
3. **Memoria**: Los datos se cargan bajo demanda para optimizar el uso de memoria
4. **Formatos**: Soporta todos los formatos HDF5 estándar de HEC-RAS

## Solución de Problemas

### Error: "No se encontraron archivos HDF5"
- Verificar que la ruta sea correcta
- Asegurar que el proyecto HEC-RAS tenga resultados calculados

### Error: "Archivo no accesible"
- Verificar permisos de lectura
- Cerrar HEC-RAS si tiene el archivo abierto
- Verificar que el archivo no esté corrupto

### Error de memoria
- Para archivos muy grandes, usar extracción selectiva
- Aumentar memoria virtual del sistema

## Contribuciones

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear rama feature
3. Commit de cambios
4. Push a la rama
5. Crear Pull Request
