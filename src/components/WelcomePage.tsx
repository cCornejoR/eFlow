import { motion } from "framer-motion";
import Logo from "@/assets/logo.svg";
import { StarBorder } from "@/components/ui/StarBorder";
import BeamsComponent from "@/components/beams";

interface WelcomePageProps {
  onEFlowViewer: () => void;
  onHdfAnalysis: () => void;
}

export default function WelcomePage({
  onEFlowViewer,
  onHdfAnalysis,
}: WelcomePageProps) {
  return (
    <div className="h-screen overflow-hidden flex items-center justify-center relative">
      {/* Beams background */}
      <div className="absolute inset-0 z-0">
        <BeamsComponent
          beamWidth={2}
          beamHeight={15}
          beamNumber={8}
          lightColor="#ffffff"
          speed={1.5}
          noiseIntensity={1.2}
          scale={0.15}
          rotation={0}
        />
      </div>

      {/* Content overlay */}
      <div className="max-w-2xl mx-auto text-center px-6 relative z-20 backdrop-blur-sm bg-black/20 bg-black/30 rounded-2xl p-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <img
                src={Logo}
                alt="EFlow Logo"
                className="h-12 w-12 object-contain"
              />
              <h1 className="text-4xl text-white text-white eflow-title ml-2 text-shadow-glow">
                eFlow
              </h1>
            </div>
            <p className="text-lg text-white/90 text-white/90 max-w-lg mx-auto leading-relaxed font-medium text-shadow-glow">
              Visualizador y analizador de proyectos HEC-RAS 2D con integración
              de ras-commander para análisis hidráulico avanzado.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <StarBorder
              onClick={onEFlowViewer}
              speed="4s"
              color="hsl(var(--primary))"
              className="font-medium shadow-lg"
            >
              <div className="inline-flex items-center">
                Iniciar eFlow Viewer
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🚀
                </motion.div>
              </div>
            </StarBorder>

            <StarBorder
              onClick={onHdfAnalysis}
              speed="3s"
              color="hsl(var(--secondary))"
              className="font-medium shadow-lg"
            >
              <div className="inline-flex items-center">
                HDF5 Analysis
                <motion.div
                  className="ml-2"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📊
                </motion.div>
              </div>
            </StarBorder>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-card/80 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-6 shadow-lg shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-lg font-semibold text-card-foreground mb-1">
                Rust + Python
              </div>
              <div className="text-xs text-muted-foreground">
                Rendimiento Nativo
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-card-foreground mb-1">
                Formato HDF5
              </div>
              <div className="text-xs text-muted-foreground">
                Soporte de Archivos
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-card-foreground mb-1">
                Compatible HEC-RAS
              </div>
              <div className="text-xs text-muted-foreground">
                Procesamiento de Datos
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-white/70 text-white/70 font-medium leading-relaxed">
            Construido con Tauri, React y Python para máximo rendimiento y
            confiabilidad
          </p>
        </motion.div>
      </div>
    </div>
  );
}
