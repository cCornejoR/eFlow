use pyo3::prelude::*;

pub mod hdf5_analyzer;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// HDF5 Analysis Commands
#[tauri::command]
async fn analyze_hdf5_info(file_path: String) -> Result<hdf5_analyzer::FileInfo, String> {
    hdf5_analyzer::HDF5Analyzer::get_file_info(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn analyze_hdf5_structure(file_path: String) -> Result<hdf5_analyzer::FileStructure, String> {
    hdf5_analyzer::HDF5Analyzer::get_file_structure(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_hdf5_datasets(file_path: String) -> Result<Vec<String>, String> {
    hdf5_analyzer::HDF5Analyzer::list_datasets(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn extract_hecras_data(file_path: String) -> Result<hdf5_analyzer::HecRasData, String> {
    hdf5_analyzer::HDF5Analyzer::extract_hecras_data(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_hdf5_dataset_sample(file_path: String, dataset_path: String, max_elements: usize) -> Result<Vec<f64>, String> {
    hdf5_analyzer::HDF5Analyzer::read_dataset_sample(&file_path, &dataset_path, max_elements)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn find_hdf5_files(folder_path: String) -> Result<Vec<hdf5_analyzer::FileInfo>, String> {
    hdf5_analyzer::HDF5Analyzer::find_hdf_files(&folder_path)
        .map_err(|e| e.to_string())
}

pub fn tauri_generate_context() -> tauri::Context {
    tauri::generate_context!()
}

#[pymodule(gil_used = false)]
#[pyo3(name = "ext_mod")]
pub mod ext_mod {
    use super::*;

    #[pymodule_init]
    fn init(module: &Bound<'_, PyModule>) -> PyResult<()> {
        pytauri::pymodule_export(
            module,
            // i.e., `context_factory` function of python binding
            |_args, _kwargs| Ok(tauri_generate_context()),
            // i.e., `builder_factory` function of python binding
            |_args, _kwargs| {
                let builder = tauri::Builder::default()
                    .plugin(tauri_plugin_opener::init())
                    .plugin(tauri_plugin_dialog::init())
                    .invoke_handler(tauri::generate_handler![
                        greet,
                        analyze_hdf5_info,
                        analyze_hdf5_structure,
                        list_hdf5_datasets,
                        extract_hecras_data,
                        read_hdf5_dataset_sample,
                        find_hdf5_files
                    ]);
                Ok(builder)
            },
        )
    }
}
