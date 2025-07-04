import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  AlertCircle,
  Info,
  HelpCircle,
  Search,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { TreeView, TreeNode } from "@/components/ui/tree";
import { cn, formatFileSize } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getDetailedHdfStructure } from "@/lib/tauri-commands";
import type { HdfDetailedNode, HdfDetailedStructureResponse } from "@/lib/tauri-commands";

interface HDF5FileInfo {
  filename: string;
  exists: boolean;
  size?: number;
  error?: string;
  is_pyhmt2d_compatible?: boolean;
  file_type?: string; // 'pyhmt2d', 'generic_hdf5', 'invalid'
}

interface HDF5Structure {
  name: string;
  type: string;
  path: string;
  children: HDF5Structure[];
  attributes: Record<string, any>;
  shape?: number[];
  dtype?: string;
}

interface HDF5FileCandidate {
  filename: string;
  full_path: string;
  file_type: string;
  size: number;
  is_valid_hdf5: boolean;
  error?: string;
}

interface FolderAnalysisResult {
  folder_path: string;
  total_files: number;
  hdf_files: HDF5FileCandidate[];
  u_files: HDF5FileCandidate[];
  g_files: HDF5FileCandidate[];
  other_hdf_files: HDF5FileCandidate[];
  error?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onFileSelect?: (filePath: string, structure: HDF5Structure) => void;
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  onFileSelect,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileInfo, setFileInfo] = useState<HDF5FileInfo | null>(null);
  const [fileStructure, setFileStructure] = useState<HDF5Structure | null>(
    null
  );
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState("");

  // Folder analysis states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderAnalysisResult, setFolderAnalysisResult] =
    useState<FolderAnalysisResult | null>(null);
  const [analyzingFolder, setAnalyzingFolder] = useState(false);

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "HDF5 Files",
            extensions: ["h5", "hdf5", "he5"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setSelectedFile(selected);
        await loadFile(selected);
      }
    } catch (err) {
      setError(`Error selecting file: ${err}`);
    }
  };

  const loadFile = async (filePath: string) => {
    setLoading(true);
    setError("");

    try {
      // Check file info
      const info = await invoke<HDF5FileInfo>("check_hdf5_file", {
        body: { filename: filePath },
      });
      setFileInfo(info);

      if (info.exists) {
        try {
          // Try to get detailed HDF structure first
          const detailedResponse = await getDetailedHdfStructure({
            file_path: filePath,
            max_depth: 10,
            include_attributes: true
          });

          if (detailedResponse.success && detailedResponse.root_node) {
            // Use detailed structure
            const treeNodes = convertDetailedHdfToTreeNodes(detailedResponse.root_node);
            setTreeData(treeNodes);

            // Create a compatible structure for the parent component
            const compatibleStructure: HDF5Structure = {
              name: detailedResponse.filename,
              type: "group",
              path: "/",
              children: [],
              attributes: detailedResponse.root_node.attributes || {}
            };
            setFileStructure(compatibleStructure);
            onFileSelect?.(filePath, compatibleStructure);
          } else {
            // Fallback to legacy structure if detailed analysis fails
            if (info.file_type === "pyhmt2d" || info.file_type === "generic_hdf5") {
              const structure = await invoke<HDF5Structure>("get_hdf5_structure", {
                body: { filename: filePath },
              });
              setFileStructure(structure);

              // Convert to tree format
              const treeNodes = convertToTreeNodes(structure);
              setTreeData(treeNodes);

              // Notify parent component
              onFileSelect?.(filePath, structure);
            } else {
              setFileStructure(null);
              setTreeData([]);
            }
          }
        } catch (detailedError) {
          console.warn("Detailed analysis failed, falling back to legacy:", detailedError);

          // Fallback to legacy structure
          if (info.file_type === "pyhmt2d" || info.file_type === "generic_hdf5") {
            const structure = await invoke<HDF5Structure>("get_hdf5_structure", {
              body: { filename: filePath },
            });
            setFileStructure(structure);

            // Convert to tree format
            const treeNodes = convertToTreeNodes(structure);
            setTreeData(treeNodes);

            // Notify parent component
            onFileSelect?.(filePath, structure);
          } else {
            setFileStructure(null);
            setTreeData([]);
          }
        }
      } else {
        setFileStructure(null);
        setTreeData([]);
      }
    } catch (err) {
      setError(`Error al cargar archivo: ${err}`);
      setFileInfo(null);
      setFileStructure(null);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  // Convert detailed HDF structure to tree format
  const convertDetailedHdfToTreeNodes = (detailedNode: HdfDetailedNode): TreeNode[] => {
    const convertNode = (node: HdfDetailedNode): TreeNode => {
      let label = node.name;

      // Add type and metadata information to label
      if (node.type === "dataset") {
        if (node.shape && node.shape.length > 0) {
          const shapeStr = node.shape.join(" × ");
          label += ` [${shapeStr}]`;
        }
        if (node.dtype) {
          label += ` (${node.dtype})`;
        }
        if (node.size !== undefined) {
          label += ` - ${node.size} elements`;
        }
      } else if (node.type === "group") {
        const childCount = node.children.length;
        label += ` (${childCount} items)`;
      }

      // Add attributes info if available
      const attrCount = Object.keys(node.attributes || {}).length;
      if (attrCount > 0) {
        label += ` [${attrCount} attrs]`;
      }

      return {
        id: `detailed-${node.path}`,
        label,
        icon: node.type === "group" ? <FolderOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />,
        children: node.children.map(convertNode),
        data: {
          type: node.type,
          path: node.path,
          shape: node.shape,
          dtype: node.dtype,
          size: node.size,
          attributes: node.attributes,
          isDetailed: true
        }
      };
    };

    return node.children.map(convertNode);
  };

  const convertToTreeNodes = (structure: HDF5Structure): TreeNode[] => {
    const convertNode = (node: HDF5Structure): TreeNode => {
      const isGroup = node.type === "group";
      const icon = isGroup ? (
        <FolderOpen className="h-4 w-4" />
      ) : (
        <FileText className="h-4 w-4" />
      );

      return {
        id: node.path,
        label: node.name,
        icon,
        children: node.children?.map(convertNode) || [],
        data: {
          type: node.type,
          path: node.path,
          attributes: node.attributes,
          shape: node.shape,
          dtype: node.dtype,
        },
      };
    };

    return structure.children?.map(convertNode) || [convertNode(structure)];
  };

  const clearFile = () => {
    setSelectedFile("");
    setFileInfo(null);
    setFileStructure(null);
    setTreeData([]);
    setError("");
  };

  const handleFolderAnalysis = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        setAnalyzingFolder(true);
        setError("");

        // Use simplified p*.hdf analysis
        const result = await invoke<any>("analyze_folder_for_p_files", {
          body: { folder_path: selected },
        });

        setFolderAnalysisResult(result);
        setShowFolderModal(true);
      }
    } catch (err) {
      setError(`Error analizando carpeta: ${err}`);
    } finally {
      setAnalyzingFolder(false);
    }
  };

  const handleFolderFileSelect = async (filePath: string) => {
    setShowFolderModal(false);
    await loadFile(filePath);
  };

  const handleNodeClick = (node: TreeNode) => {
    console.log("Node clicked:", node);

    // If this is a detailed node with data, show more information
    if (node.data?.isDetailed) {
      const nodeData = node.data;
      console.log("Detailed node data:", {
        type: nodeData.type,
        path: nodeData.path,
        shape: nodeData.shape,
        dtype: nodeData.dtype,
        size: nodeData.size,
        attributes: nodeData.attributes
      });

      // You could show a modal or update a details panel here
      // For now, we'll just log the information
      if (nodeData.type === "dataset") {
        console.log(`Dataset: ${nodeData.path}`);
        if (nodeData.shape) {
          console.log(`Shape: [${nodeData.shape.join(', ')}]`);
        }
        if (nodeData.dtype) {
          console.log(`Data type: ${nodeData.dtype}`);
        }
        if (nodeData.size) {
          console.log(`Size: ${nodeData.size} elements`);
        }
      } else if (nodeData.type === "group") {
        console.log(`Group: ${nodeData.path}`);
      }

      if (nodeData.attributes && Object.keys(nodeData.attributes).length > 0) {
        console.log("Attributes:", nodeData.attributes);
      }
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 60 : 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full card-gradient border-r border-border flex flex-col relative"
    >
      {/* Header */}
      <div className="h-16 px-4 border-b border-border flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2 relative"
            >
              <Database className="h-5 w-5 text-primary" />
              <span className="font-semibold text-card-foreground">
                Explorador HDF5
              </span>

              {/* Tooltip Button */}
              <button
                title="Ayuda sobre el formato de archivo"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-1 rounded-full hover:bg-primary/10 transition-all duration-200 hover-lift"
              >
                <HelpCircle className="h-4 w-4 text-primary/70 hover:text-primary" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Controls */}
        <div className="flex items-center space-x-2">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2"
              >
                {/* Home Button */}
                <motion.button
                  onClick={() => {
                    setSelectedFolder("");
                    setFolderAnalysis(null);
                    setFileInfo(null);
                    setFileStructure(null);
                    setTreeData([]);
                    setError(null);
                  }}
                  className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent transition-colors focus-ring"
                  whileTap={{ scale: 0.95 }}
                  title="Volver al inicio"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <FolderOpen className="h-4 w-4 text-foreground" />
                  </motion.div>
                </motion.button>

                {/* Theme Toggle Button */}
                <motion.button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent transition-colors focus-ring"
                  whileTap={{ scale: 0.95 }}
                  title={
                    theme === "dark"
                      ? "Cambiar a modo claro"
                      : "Cambiar a modo oscuro"
                  }
                >
                  <motion.div
                    initial={false}
                    animate={{
                      rotate: theme === "dark" ? 0 : 180,
                      scale: theme === "dark" ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative"
                  >
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4 text-foreground" />
                    ) : (
                      <Sun className="h-4 w-4 text-foreground" />
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Toggle */}
          <motion.button
            onClick={onToggle}
            className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent transition-colors focus-ring"
            whileTap={{ scale: 0.95 }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </motion.button>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-full ml-4 top-0 z-50 w-80 p-4 card-gradient border border-border rounded-lg shadow-xl hover-lift"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Info className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-card-foreground">
                          Formato de Archivo Requerido
                        </h3>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          <strong>pyHMT2D</strong> requiere archivos HDF5 con
                          una estructura específica:
                        </p>

                        <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                          <div>📁 archivo.h5</div>
                          <div className="ml-4">└── input_values/</div>
                          <div className="ml-8">├── model_type</div>
                          <div className="ml-8">├── geometry/</div>
                          <div className="ml-8">├── boundary_conditions/</div>
                          <div className="ml-8">└── material_properties/</div>
                        </div>

                        <p>
                          El archivo debe contener datos de modelado
                          hidrogeológico con las propiedades del modelo,
                          geometría y condiciones de contorno.
                        </p>

                        <div className="flex items-center space-x-1 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">
                            Los archivos HDF5 genéricos no son compatibles
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>



      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="h-full flex flex-col p-4 space-y-4"
            >
              {/* File Selection */}
              <div className="space-y-3">
                <button
                  onClick={handleFileSelect}
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200",
                    "border-border hover:border-primary/50 hover:bg-primary/5",
                    "focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {loading ? "Cargando..." : "Cargar Archivo HDF5"}
                  </span>
                </button>

                <div className="relative">
                  <button
                    onClick={handleFolderAnalysis}
                    disabled={loading || analyzingFolder}
                    className={cn(
                      "w-full flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200",
                      "border-border hover:border-green-500/50 hover:bg-green-500/5",
                      "focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Busca archivos *.u##.hdf (resultados hidráulicos) y *.g##.hdf (geometría) en una carpeta"
                  >
                    <Search className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analyzingFolder
                        ? "Analizando..."
                        : "Buscar Archivos U/G"}
                    </span>
                  </button>
                </div>

                {/* File Info */}
                {fileInfo && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Información del Archivo
                      </span>
                      <button
                        onClick={clearFile}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                        title="Quitar archivo"
                        aria-label="Quitar archivo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="truncate" title={fileInfo.filename}>
                        <span className="text-muted-foreground">File:</span>{" "}
                        {fileInfo.filename.split(/[/\\]/).pop()}
                      </div>

                      {fileInfo.size && (
                        <div>
                          <span className="text-muted-foreground">Size:</span>{" "}
                          {formatFileSize(fileInfo.size)}
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Status:</span>
                        {fileInfo.exists &&
                        (fileInfo.file_type === "pyhmt2d" ||
                          fileInfo.file_type === "generic_hdf5") ? (
                          <span className="text-green-500">✓ Valid HDF5</span>
                        ) : (
                          <span className="text-destructive">✗ Invalid</span>
                        )}
                      </div>

                      {fileInfo.file_type && (
                        <div className="flex items-center space-x-1">
                          <span className="text-muted-foreground">Type:</span>
                          {fileInfo.file_type === "pyhmt2d" ? (
                            <span className="text-blue-500">
                              pyHMT2D Compatible
                            </span>
                          ) : fileInfo.file_type === "generic_hdf5" ? (
                            <span className="text-yellow-500">
                              Generic HDF5
                            </span>
                          ) : (
                            <span className="text-red-500">Invalid</span>
                          )}
                        </div>
                      )}
                    </div>

                    {fileInfo.error && (
                      <div className="flex items-start space-x-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{fileInfo.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="flex items-start space-x-2 p-3 bg-destructive/10 rounded-lg text-xs text-destructive">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Tree View */}
              {treeData.length > 0 && (
                <div className="flex-1 min-h-0">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    File Structure
                  </div>
                  <div
                    className="auto-scroll"
                    style={{ maxHeight: "calc(100vh - 400px)" }}
                  >
                    <TreeView
                      data={treeData}
                      onNodeClick={handleNodeClick}
                      className="border-0"
                      showLines={true}
                      showIcons={true}
                      selectable={true}
                      animateExpand={true}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="p-2 flex flex-col items-center space-y-3">
            <button
              onClick={handleFileSelect}
              disabled={loading}
              className="p-3 rounded-lg hover:bg-accent transition-colors focus-ring disabled:opacity-50"
              title="Cargar Archivo HDF5"
            >
              <Upload className="h-5 w-5" />
            </button>

            {fileInfo && fileInfo.exists && !fileInfo.error && (
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                title="File loaded"
              />
            )}
          </div>
        )}
      </div>

      {/* Folder Analysis Modal - Placeholder */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Folder Analysis</h3>
            <p className="text-muted-foreground mb-4">
              Folder analysis functionality will be implemented here.
            </p>
            <button
              onClick={() => setShowFolderModal(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
