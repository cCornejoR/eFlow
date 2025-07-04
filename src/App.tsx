import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import WelcomePage from "@/components/WelcomePage";
import EFlowViewer from "@/components/eFlowViewer";

function AppContent() {
  const [showWelcome, setShowWelcome] = useState(true);

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleBackToHome = () => {
    setShowWelcome(true);
  };

  return (
    <div className="h-screen flex text-foreground overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <WelcomePage onEFlowViewer={handleGetStarted} />
          </motion.div>
        ) : (
          <motion.div
            key="eflow-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <EFlowViewer onBackToHome={handleBackToHome} />
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
