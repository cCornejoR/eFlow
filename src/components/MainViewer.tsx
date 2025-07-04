import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HDF5Structure {
  name: string;
  type: string;
  path: string;
  children: HDF5Structure[];
  attributes: Record<string, any>;
  shape?: number[];
  dtype?: string;
}

interface MainViewerProps {
  selectedFile: string;
  fileStructure: HDF5Structure | null;
  onBackToHome: () => void;
}

const MainViewer: React.FC<MainViewerProps> = ({
  selectedFile,
  fileStructure,
  onBackToHome,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={onBackToHome}
            className="flex items-center space-x-2 text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-xl font-semibold text-foreground">
            <span className="eFlow-title">eFlow</span> Visor
          </h1>
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              {selectedFile.split(/[/\\]/).pop()}
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex-1 p-6 auto-scroll"
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">HDF5 File Viewer</h2>
              <Button onClick={onBackToHome} variant="outline" size="sm">
                Close
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Selected file:
              </p>
              <p className="font-mono text-sm">{selectedFile}</p>
              <p className="text-muted-foreground mt-4">
                HDF5 viewer functionality will be implemented here.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No file selected
          </div>
        )}
      </motion.main>
    </div>
  );
};

export default MainViewer;
