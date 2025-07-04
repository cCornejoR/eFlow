# eFlow

eFlow is a powerful desktop application built with PyTauri for processing and visualizing HDF5 files, specifically designed for hydraulic model data analysis including HEC-RAS and pyHMT2D formats.

## Features

- 🗂️ HDF5 file tree viewer with hierarchical navigation
- 📊 Advanced data visualization and analysis tools
- 🎨 Modern UI with TailwindCSS and stunning animated backgrounds
- 🐍 Python backend for robust data processing
- ⚡ Fast and responsive Tauri-based desktop application
- 🔧 Built-in debug tools for development and testing
- 🌊 Specialized support for hydraulic modeling data formats

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + Framer Motion
- **Backend**: Python with PyTauri + HDF5 processing libraries
- **Desktop Framework**: Tauri
- **Build Tool**: Vite
- **Package Manager**: UV (Python), NPM (JavaScript)
- **Data Processing**: h5py, numpy, matplotlib, pyvista, plotly

## Quick Start

1. **Prerequisites**:

   - Node.js (v18 or higher)
   - Python (v3.8 or higher)
   - Rust (latest stable)
   - UV package manager

2. **Installation**:

   ```bash
   # Clone the repository
   git clone https://github.com/cCornejoR/eFlow.git
   cd eFlow

   # Install dependencies
   npm install
   uv sync
   ```

3. **Development**:

   ```bash
   # Start the application
   ./quick_start.bat  # Windows
   # or
   npm run tauri dev
   ```

4. **Build**:

   ```bash
   npm run tauri build
   ```

## Project Structure

```text
eFlow/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   └── lib/               # Utility libraries
├── src-tauri/             # Tauri backend
│   ├── src-python/        # Python backend code
│   └── src/               # Rust code
├── public/                # Static assets
├── scripts/               # Build and deployment scripts
└── docs/                  # Documentation
```

## Usage

1. Launch eFlow using `quick_start.bat`
2. Load HDF5 files using the file browser
3. Navigate the file structure in the tree view
4. Analyze and visualize your hydraulic model data (HEC-RAS, pyHMT2D)
5. Use the debug tools for development and testing

## HEC-RAS Support

eFlow provides specialized support for HEC-RAS hydraulic modeling files with advanced visualization capabilities:

### Supported Visualizations

- **🏔️ Topography Surface Rendering**: 3D visualization of terrain elevation data using PyVista
- **🌊 Flood Extent Mapping**: Interactive flood depth and extent visualization with configurable thresholds
- **🔗 Combined Visualizations**: Overlay topography and flood extent in a single view
- **💨 Velocity Field Plots**: Vector field visualization showing flow velocity magnitude and direction

### HEC-RAS File Features

- **Automatic Detection**: Automatically identifies HEC-RAS file structure and available datasets
- **Metadata Extraction**: Extracts simulation metadata including plan name, computation time, and model extent
- **Multi-Format Support**: Supports both 1D and 2D HEC-RAS model results
- **Time Series Data**: Handles unsteady flow results with time step selection
- **Data Quality Metrics**: Provides mesh quality analysis and statistics

### Specialized Controls

- **Flood Threshold Adjustment**: Real-time adjustment of flood depth thresholds (0.01m to 5.0m)
- **Layer Transparency**: Configurable transparency for combined visualizations
- **Export Options**: Download capabilities for all visualization types
- **Advanced Filtering**: Filter files by data availability (topography, flood results, velocity)

## Contributing

Please read [COMMIT_GUIDELINES.md](./COMMIT_GUIDELINES.md) for our commit message conventions and development workflow.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
