import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Database,
  BarChart,
  FolderOpen,
  Check,
  Square,
} from "lucide-react";
import { TreeNode, TreeViewProps, TREE_NODE_ICONS } from "../types/ras-commander";

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  level: number;
  onNodeSelect: (nodePath: string, selected: boolean) => void;
  onNodeExpand: (nodePath: string, expanded: boolean) => void;
  selectedNodes: Set<string>;
  expandedNodes: Set<string>;
  selectable: boolean;
  showMetadata: boolean;
}> = ({
  node,
  level,
  onNodeSelect,
  onNodeExpand,
  selectedNodes,
  expandedNodes,
  selectable,
  showMetadata,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.path);
  const isSelected = selectedNodes.has(node.path);

  const handleToggleExpand = useCallback(() => {
    if (hasChildren) {
      onNodeExpand(node.path, !isExpanded);
    }
  }, [hasChildren, isExpanded, node.path, onNodeExpand]);

  const handleToggleSelect = useCallback(() => {
    if (selectable) {
      onNodeSelect(node.path, !isSelected);
    }
  }, [selectable, isSelected, node.path, onNodeSelect]);

  const getNodeIcon = () => {
    switch (node.type) {
      case 'file':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'group':
        return isExpanded ? (
          <FolderOpen className="w-4 h-4 text-yellow-500" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-500" />
        );
      case 'dataset':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'result':
        return <BarChart className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNodeTypeLabel = () => {
    switch (node.type) {
      case 'file':
        return 'File';
      case 'group':
        return 'Group';
      case 'dataset':
        return 'Dataset';
      case 'result':
        return 'Result';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors duration-150 ${
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted/50"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <div className="w-4 h-4 mr-1 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={handleToggleExpand}
              className="p-0.5 rounded hover:bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : null}
        </div>

        {/* Selection Checkbox */}
        {selectable && (
          <button
            onClick={handleToggleSelect}
            className="w-4 h-4 mr-2 flex items-center justify-center"
          >
            {isSelected ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <Square className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Node Icon */}
        <div className="mr-2">{getNodeIcon()}</div>

        {/* Node Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground truncate">
              {node.name}
            </span>
            <span className="text-xs text-muted-foreground">
              ({getNodeTypeLabel()})
            </span>
            {node.has_data && (
              <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                Data
              </span>
            )}
          </div>

          {/* Metadata */}
          {showMetadata && node.metadata && (
            <div className="text-xs text-muted-foreground mt-1">
              {node.metadata.description && (
                <div>Description: {node.metadata.description}</div>
              )}
              {node.metadata.shape && (
                <div>Shape: [{node.metadata.shape.join(", ")}]</div>
              )}
              {node.metadata.dtype && (
                <div>Type: {node.metadata.dtype}</div>
              )}
              {node.metadata.file_size && (
                <div>Size: {formatFileSize(node.metadata.file_size)}</div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child, index) => (
              <TreeNodeComponent
                key={`${child.path}-${index}`}
                node={child}
                level={level + 1}
                onNodeSelect={onNodeSelect}
                onNodeExpand={onNodeExpand}
                selectedNodes={selectedNodes}
                expandedNodes={expandedNodes}
                selectable={selectable}
                showMetadata={showMetadata}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TreeView: React.FC<TreeViewProps> = ({
  tree,
  onNodeSelect,
  onNodeExpand,
  selectedNodes,
  expandedNodes,
  selectable = true,
  showMetadata = false,
}) => {
  return (
    <div className="tree-view">
      <TreeNodeComponent
        node={tree}
        level={0}
        onNodeSelect={onNodeSelect}
        onNodeExpand={onNodeExpand}
        selectedNodes={selectedNodes}
        expandedNodes={expandedNodes}
        selectable={selectable}
        showMetadata={showMetadata}
      />
    </div>
  );
};

// Utility function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default TreeView;
