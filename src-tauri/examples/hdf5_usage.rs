use eFlow_lib::hdf5_analyzer::HDF5Analyzer;
use std::env;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Obtener argumentos de línea de comandos
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Uso: cargo run --example hdf5_usage <ruta_archivo_hdf5>");
        return Ok(());
    }
    
    let file_path = &args[1];
    
    println!("🔍 Analizando archivo HDF5: {}", file_path);
    println!("=" .repeat(80));
    
    // 1. Obtener información básica del archivo
    println!("\n📋 INFORMACIÓN BÁSICA DEL ARCHIVO:");
    match HDF5Analyzer::get_file_info(file_path) {
        Ok(info) => {
            println!("  Nombre: {}", info.name);
            println!("  Tamaño: {:.2} MB", info.size_mb);
            println!("  Modificado: {}", info.modified);
            println!("  Accesible: {}", info.accessible);
            println!("  Grupos: {}", info.groups_count);
            println!("  Datasets: {}", info.datasets_count);
            
            if let Some(error) = info.error {
                println!("  ⚠️  Error: {}", error);
            }
        }
        Err(e) => {
            eprintln!("❌ Error al obtener información del archivo: {}", e);
            return Ok(());
        }
    }
    
    // 2. Listar todos los datasets
    println!("\n📄 DATASETS ENCONTRADOS:");
    match HDF5Analyzer::list_datasets(file_path) {
        Ok(datasets) => {
            if datasets.is_empty() {
                println!("  No se encontraron datasets.");
            } else {
                println!("  Total: {} datasets", datasets.len());
                for (i, dataset) in datasets.iter().take(10).enumerate() {
                    println!("  {:2}. {}", i + 1, dataset);
                }
                if datasets.len() > 10 {
                    println!("  ... y {} más", datasets.len() - 10);
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Error al listar datasets: {}", e);
        }
    }
    
    // 3. Obtener estructura del archivo (limitada para evitar output muy largo)
    println!("\n🌳 ESTRUCTURA DEL ARCHIVO (primeros niveles):");
    match HDF5Analyzer::get_file_structure(file_path) {
        Ok(structure) => {
            println!("  Total grupos: {}", structure.total_groups);
            println!("  Total datasets: {}", structure.total_datasets);
            
            // Mostrar solo los primeros niveles para evitar spam
            print_limited_structure(&structure.root, 0, 2);
        }
        Err(e) => {
            eprintln!("❌ Error al obtener estructura: {}", e);
        }
    }
    
    // 4. Intentar extraer datos específicos de HEC-RAS
    println!("\n🌊 ANÁLISIS ESPECÍFICO DE HEC-RAS:");
    match HDF5Analyzer::extract_hecras_data(file_path) {
        Ok(hecras_data) => {
            println!("  📊 Resumen de extracción:");
            for (key, value) in &hecras_data.extraction_summary {
                println!("    {}: {}", key, value);
            }
            
            if !hecras_data.geometry_data.is_empty() {
                println!("  🏗️  Datos de geometría encontrados:");
                for (dataset_path, data) in hecras_data.geometry_data.iter().take(3) {
                    println!("    📄 {}", dataset_path);
                    println!("       Elementos: {}", data.len());
                    if !data.is_empty() {
                        let sample_size = std::cmp::min(3, data.len());
                        println!("       Muestra: {:?}...", &data[..sample_size]);
                    }
                }
            }
            
            if !hecras_data.results_data.is_empty() {
                println!("  📈 Datos de resultados encontrados:");
                for (dataset_path, data) in hecras_data.results_data.iter().take(3) {
                    println!("    📄 {}", dataset_path);
                    println!("       Elementos: {}", data.len());
                    if !data.is_empty() {
                        let sample_size = std::cmp::min(3, data.len());
                        println!("       Muestra: {:?}...", &data[..sample_size]);
                    }
                }
            }
            
            if !hecras_data.metadata.is_empty() {
                println!("  📋 Metadatos encontrados:");
                for (key, value) in hecras_data.metadata.iter().take(5) {
                    println!("    {}: {}", key, value);
                }
                if hecras_data.metadata.len() > 5 {
                    println!("    ... y {} más", hecras_data.metadata.len() - 5);
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Error al extraer datos de HEC-RAS: {}", e);
        }
    }
    
    // 5. Ejemplo de lectura de dataset específico
    println!("\n🔬 EJEMPLO DE LECTURA DE DATASET:");
    
    // Intentar leer algunos datasets comunes
    let common_datasets = vec![
        "/Results/2D/MaxWSE",
        "/Results/2D/MaxVel", 
        "/Results/2D/MaxDepth",
        "/Geometry/2D Flow Areas/Area 2D/Cells Center Coordinate",
    ];
    
    for dataset_path in common_datasets {
        match HDF5Analyzer::read_dataset_sample(file_path, dataset_path, 5) {
            Ok(data) => {
                println!("  ✅ {}", dataset_path);
                println!("     Elementos leídos: {}", data.len());
                if !data.is_empty() {
                    println!("     Datos: {:?}", data);
                }
            }
            Err(_) => {
                // No mostrar errores para datasets que no existen
                continue;
            }
        }
    }
    
    println!("\n✅ Análisis completado!");
    println!("\n💡 Para usar el script standalone:");
    println!("   cargo run --bin hdf5_analyzer info \"{}\"", file_path);
    println!("   cargo run --bin hdf5_analyzer structure \"{}\"", file_path);
    println!("   cargo run --bin hdf5_analyzer hecras \"{}\"", file_path);
    
    Ok(())
}

fn print_limited_structure(node: &eFlow_lib::hdf5_analyzer::TreeNode, depth: usize, max_depth: usize) {
    if depth > max_depth {
        return;
    }
    
    let indent = "  ".repeat(depth);
    let icon = match node.node_type.as_str() {
        "group" => "📁",
        "dataset" => "📄",
        _ => "❓",
    };
    
    print!("  {}{} {}", indent, icon, node.name);
    
    if node.node_type == "dataset" {
        if let Some(shape) = &node.shape {
            print!(" {:?}", shape);
        }
    }
    
    println!();
    
    // Solo mostrar algunos hijos para evitar spam
    let children_to_show = std::cmp::min(5, node.children.len());
    for child in node.children.iter().take(children_to_show) {
        print_limited_structure(child, depth + 1, max_depth);
    }
    
    if node.children.len() > children_to_show {
        let remaining = node.children.len() - children_to_show;
        println!("  {}  ... y {} elementos más", "  ".repeat(depth + 1), remaining);
    }
}
