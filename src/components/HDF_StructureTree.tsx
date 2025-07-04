/**
 * HDF Structure Tree - Component for displaying HDF5 file structure as a tree
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Database,
  Folder,
  FolderOpen,
  FileText,
  Info,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/badge";
import { HdfExplorerStructureNode } from "../lib/tauri-commands";

interface TreeNodeData {
  id: string;
  name: string;
  type: "group" | "dataset";
  path: string;
  children?: TreeNodeData[];
  shape?: number[];
  dtype?: string;
  size?: number;
  attrs?: Record<string, any>;
}

interface HDF_StructureTreeProps {
  filePath: string;
  structureData: {
    total_groups: number;
    total_datasets: number;
    tree: Record<string, HdfExplorerStructureNode>;
  };
}

export function HDF_StructureTree({
  filePath,
  structureData,
}: HDF_StructureTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["root"])
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Convert structure data to tree format
  const treeData = useMemo(() => {
    const convertNode = (
      nodeData: Record<string, HdfExplorerStructureNode>,
      parentPath: string = ""
    ): TreeNodeData[] => {
      return Object.entries(nodeData).map(([name, node]) => {
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        const id = currentPath || name;

        const treeNode: TreeNodeData = {
          id,
          name,
          type: node.type,
          path: currentPath,
          shape: node.shape,
          dtype: node.dtype,
          size: node.size,
          attrs: node.attrs,
        };

        if (node.children && Object.keys(node.children).length > 0) {
          treeNode.children = convertNode(node.children, currentPath);
        }

        return treeNode;
      });
    };

    return convertNode(structureData.tree);
  }, [structureData.tree]);

  // Filter tree based on search term
  const filteredTreeData = useMemo(() => {
    if (!searchTerm) return treeData;

    const filterNode = (nodes: TreeNodeData[]): TreeNodeData[] => {
      return nodes.reduce((acc: TreeNodeData[], node) => {
        const matchesSearch =
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.path.toLowerCase().includes(searchTerm.toLowerCase());

        let filteredChildren: TreeNodeData[] = [];
        if (node.children) {
          filteredChildren = filterNode(node.children);
        }

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children:
              filteredChildren.length > 0 ? filteredChildren : node.children,
          });
        }

        return acc;
      }, []);
    };

    return filterNode(treeData);
  }, [treeData, searchTerm]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Select node
  const selectNode = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  // Expand all nodes
  const expandAll = useCallback(() => {
    const getAllNodeIds = (nodes: TreeNodeData[]): string[] => {
      const ids: string[] = [];
      nodes.forEach((node) => {
        ids.push(node.id);
        if (node.children) {
          ids.push(...getAllNodeIds(node.children));
        }
      });
      return ids;
    };

    setExpandedNodes(new Set(getAllNodeIds(treeData)));
  }, [treeData]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set(["root"]));
  }, []);

  // Format data size
  const formatSize = (size?: number): string => {
    if (!size) return "";
    if (size < 1000) return `${size}`;
    if (size < 1000000) return `${(size / 1000).toFixed(1)}K`;
    return `${(size / 1000000).toFixed(1)}M`;
  };

  // Render tree node
  const renderTreeNode = (node: TreeNodeData, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isDataset = node.type === "dataset";

    return (
      <div key={node.id}>
        <motion.div
          className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-accent/50"
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => selectNode(node.id)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: level * 0.05 }}
        >
          {/* Expand/Collapse button */}
          <div className="w-4 h-4 flex items-center justify-center mr-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* Icon */}
          <div className="mr-2">
            {isDataset ? (
              <Database className="h-4 w-4 text-blue-500" />
            ) : hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-yellow-500" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-500" />
              )
            ) : (
              <FileText className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium truncate">{node.name}</span>
              {isDataset && node.shape && (
                <Badge variant="outline" className="text-xs">
                  {node.shape.join(" × ")}
                </Badge>
              )}
              {isDataset && node.dtype && (
                <Badge variant="secondary" className="text-xs">
                  {node.dtype}
                </Badge>
              )}
              {isDataset && node.size && (
                <span className="text-xs text-muted-foreground">
                  {formatSize(node.size)}
                </span>
              )}
            </div>
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
              {node.children!.map((child) => renderTreeNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Estructura del Archivo</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                title="Expandir todo"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                title="Contraer todo"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en estructura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{structureData.total_groups} grupos</span>
            <span>{structureData.total_datasets} datasets</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {filteredTreeData.length > 0 ? (
            <div className="space-y-1">
              {filteredTreeData.map((node) => renderTreeNode(node))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm
                    ? "No se encontraron coincidencias"
                    : "No hay datos para mostrar"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected node details */}
      {selectedNode && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Info className="mr-2 h-4 w-4" />
              Detalles del Nodo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {(() => {
              const findNode = (
                nodes: TreeNodeData[],
                id: string
              ): TreeNodeData | null => {
                for (const node of nodes) {
                  if (node.id === id) return node;
                  if (node.children) {
                    const found = findNode(node.children, id);
                    if (found) return found;
                  }
                }
                return null;
              };

              const node = findNode(treeData, selectedNode);
              if (!node) return null;

              return (
                <div className="space-y-2">
                  <div>
                    <strong>Ruta:</strong> {node.path}
                  </div>
                  <div>
                    <strong>Tipo:</strong> {node.type}
                  </div>
                  {node.shape && (
                    <div>
                      <strong>Forma:</strong> [{node.shape.join(", ")}]
                    </div>
                  )}
                  {node.dtype && (
                    <div>
                      <strong>Tipo de dato:</strong> {node.dtype}
                    </div>
                  )}
                  {node.size && (
                    <div>
                      <strong>Tamaño:</strong> {node.size.toLocaleString()}{" "}
                      elementos
                    </div>
                  )}
                  {node.attrs && Object.keys(node.attrs).length > 0 && (
                    <div>
                      <strong>Atributos:</strong>
                      <div className="ml-2 mt-1 space-y-1">
                        {Object.entries(node.attrs).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium">{key}:</span>{" "}
                            {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
