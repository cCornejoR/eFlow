import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import WelcomePage from "@/components/WelcomePage";
import EFlowViewer from "@/components/eFlowViewer";
import { HdfAnalysisPage } from "@/pages/HdfAnalysisPage";

type AppView = "welcome" | "eflow-viewer" | "hdf-analysis";

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>("welcome");

  const handleGetStarted = () => {
    setCurrentView("eflow-viewer");
  };

  const handleBackToHome = () => {
    setCurrentView("welcome");
  };

  const handleShowHdfAnalysis = () => {
    setCurrentView("hdf-analysis");
  };

  return (
    <div className="h-screen flex text-foreground overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {currentView === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <WelcomePage
              onEFlowViewer={handleGetStarted}
              onHdfAnalysis={handleShowHdfAnalysis}
            />
          </motion.div>
        )}

        {currentView === "eflow-viewer" && (
          <motion.div
            key="eflow-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <EFlowViewer onBackToHome={handleBackToHome} />
          </motion.div>
        )}

        {currentView === "hdf-analysis" && (
          <motion.div
            key="hdf-analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <HdfAnalysisPage onBackToHome={handleBackToHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
