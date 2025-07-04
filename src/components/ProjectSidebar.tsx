/**
 * Project Sidebar - Tree view for HEC-RAS project structure
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  FileText,
  Database,
  Activity,
  Waves,
  CheckCircle,
  AlertCircle,
  Info,
  FolderOpen,
  File,
  Grid3X3,
  Hash,
} from "lucide-react";
import { TreeView, TreeNode } from "./ui/tree";
import { Badge } from "./ui/badge";
import {
  ProjectStructureResponse,
  ProjectTreeNode,
  VtkViewerData,
  HdfFileStructure,
  HdfInternalStructure,
} from "../types/ras-commander";

interface ProjectSidebarProps {
  projectData: ProjectStructureResponse;
  onFileSelect: (node: ProjectTreeNode) => void;
  selectedFile: VtkViewerData | null;
  onBackToHome: () => void;
}

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case "geometry":
      return <Database className="h-4 w-4 text-blue-500" />;
    case "plan":
      return <FileText className="h-4 w-4 text-green-500" />;
    case "unsteady":
      return <Waves className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
}

function getHdfNodeIcon(hdfNode: HdfInternalStructure) {
  if (hdfNode.type === "group") {
    return <FolderOpen className="h-4 w-4 text-amber-500" />;
  } else if (hdfNode.type === "dataset") {
    // Different icons based on dataset characteristics
    if (hdfNode.shape && hdfNode.shape.length > 1) {
      return <Grid3X3 className="h-4 w-4 text-cyan-500" />; // Multi-dimensional array
    } else {
      return <Hash className="h-4 w-4 text-emerald-500" />; // 1D array or scalar
    }
  }
  return <File className="h-4 w-4 text-gray-500" />;
}

function formatFileSize(sizeMb: number): string {
  if (sizeMb < 1) {
    return `${(sizeMb * 1024).toFixed(0)} KB`;
  }
  return `${sizeMb.toFixed(1)} MB`;
}

// Convert HDF structure to TreeNode for internal file content
function convertHdfStructureToTreeNode(
  hdfNode: HdfInternalStructure,
  parentPath: string = ""
): TreeNode {
  const fullPath = parentPath ? `${parentPath}/${hdfNode.name}` : hdfNode.name;

  let label = hdfNode.name;

  // Add type information to label
  if (hdfNode.type === "dataset" && hdfNode.shape) {
    const shapeStr = hdfNode.shape.join(" × ");
    label += ` [${shapeStr}]`;
    if (hdfNode.dtype) {
      label += ` (${hdfNode.dtype})`;
    }
  }

  return {
    id: `hdf-${fullPath}`,
    label,
    icon: getHdfNodeIcon(hdfNode),
    children: hdfNode.children?.map((child) =>
      convertHdfStructureToTreeNode(child, fullPath)
    ),
    data: {
      ...hdfNode,
      fullPath,
      isHdfNode: true,
    },
  };
}

function createTreeNode(
  file: HdfFileStructure,
  type: "geometry" | "plan" | "unsteady" | "other"
): ProjectTreeNode {
  return {
    id: `${type}-${file.filename}`,
    name: file.filename,
    type,
    path: file.filename,
    size_mb: file.size_mb,
    has_results: file.has_results,
    cell_count: file.cell_count,
    file_info: {
      filename: file.filename,
      file_type: file.file_type,
      size_mb: file.size_mb,
      cell_count: file.cell_count || 0,
      has_results: file.has_results,
      has_geometry: file.has_geometry,
      error: file.error,
      internal_structure: file.internal_structure,
    },
  };
}

function convertToTreeNode(node: ProjectTreeNode): TreeNode {
  const baseNode: TreeNode = {
    id: node.id,
    label: node.name,
    icon: getFileTypeIcon(node.type),
    data: node,
  };

  // If it's a file with HDF internal structure, add it as children
  if (
    node.file_info &&
    node.file_info.internal_structure &&
    node.type !== "folder"
  ) {
    baseNode.children = [
      convertHdfStructureToTreeNode(
        node.file_info.internal_structure,
        node.file_info.filename
      ),
    ];
  } else if (node.children) {
    // Regular folder children
    baseNode.children = node.children.map(convertToTreeNode);
  }

  return baseNode;
}

export function ProjectSidebar({
  projectData,
  onFileSelect,
  selectedFile,
  onBackToHome,
}: ProjectSidebarProps) {
  const treeData = useMemo(() => {
    const rootNode: ProjectTreeNode = {
      id: "project-root",
      name: projectData.project_name,
      type: "project",
      children: [],
    };

    // Add geometry files folder
    if (projectData.geometry_files.length > 0) {
      const geometryFolder: ProjectTreeNode = {
        id: "geometry-folder",
        name: `Geometry Files (${projectData.geometry_files.length})`,
        type: "folder",
        children: projectData.geometry_files.map((file) =>
          createTreeNode(file, "geometry")
        ),
      };
      rootNode.children!.push(geometryFolder);
    }

    // Add plan files folder
    if (projectData.plan_files.length > 0) {
      const planFolder: ProjectTreeNode = {
        id: "plan-folder",
        name: `Plan Files (${projectData.plan_files.length})`,
        type: "folder",
        children: projectData.plan_files.map((file) =>
          createTreeNode(file, "plan")
        ),
      };
      rootNode.children!.push(planFolder);
    }

    // Add unsteady files folder
    if (projectData.unsteady_files.length > 0) {
      const unsteadyFolder: ProjectTreeNode = {
        id: "unsteady-folder",
        name: `Unsteady Files (${projectData.unsteady_files.length})`,
        type: "folder",
        children: projectData.unsteady_files.map((file) =>
          createTreeNode(file, "unsteady")
        ),
      };
      rootNode.children!.push(unsteadyFolder);
    }

    // Add other files folder
    if (projectData.other_files.length > 0) {
      const otherFolder: ProjectTreeNode = {
        id: "other-folder",
        name: `Other Files (${projectData.other_files.length})`,
        type: "folder",
        children: projectData.other_files.map((file) =>
          createTreeNode(file, "other")
        ),
      };
      rootNode.children!.push(otherFolder);
    }

    return [convertToTreeNode(rootNode)];
  }, [projectData]);

  const handleNodeClick = (node: TreeNode) => {
    // Only handle file selection for actual HDF files, not internal HDF nodes
    if (node.data && !node.data.isHdfNode && node.data.file_info) {
      onFileSelect(node.data);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Project Info Header */}
      <div className="p-4 bg-card border-b border-border">
        <div className="mb-3">
          <h3
            className="font-medium text-card-foreground truncate"
            title={projectData.project_name}
          >
            {projectData.project_name}
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span>{projectData.total_hdf_files} HDF files</span>
            </div>
            {projectData.has_prj_file && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Project file</span>
              </div>
            )}
          </div>
          {projectData.project_info && (
            <div className="text-xs text-muted-foreground">
              <Info className="h-3 w-3 inline mr-1" />
              ras-commander initialized
            </div>
          )}
        </div>
      </div>

      {/* Project Tree */}
      <div className="flex-1 overflow-auto p-2 bg-background">
        <TreeView
          data={treeData}
          onNodeClick={handleNodeClick}
          defaultExpandedIds={["project-root"]}
          showLines={true}
          showIcons={true}
          selectable={true}
          multiSelect={false}
          selectedIds={
            selectedFile?.filename
              ? [
                  `geometry-${selectedFile.filename}`,
                  `plan-${selectedFile.filename}`,
                  `unsteady-${selectedFile.filename}`,
                  `other-${selectedFile.filename}`,
                ].filter((id) =>
                  treeData[0]?.children?.some((folder) =>
                    folder.children?.some((file) => file.id === id)
                  )
                )
              : []
          }
          className="border-0 bg-transparent"
        />
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-card border-t border-border">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Database className="h-3 w-3 text-blue-500" />
            <span>{projectData.geometry_files.length} Geometry</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3 text-green-500" />
            <span>{projectData.plan_files.length} Plans</span>
          </div>
          <div className="flex items-center space-x-1">
            <Waves className="h-3 w-3 text-purple-500" />
            <span>{projectData.unsteady_files.length} Unsteady</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span>{projectData.other_files.length} Other</span>
          </div>
        </div>
      </div>
    </div>
  );
}
