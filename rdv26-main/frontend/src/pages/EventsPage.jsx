import Navbar from "@/components/rdv/Navbar";
import Events from "@/components/rdv/Events";
import Footer from "@/components/rdv/Footer";
import Waves from "@/components/rdv/Waves";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function EventsPage() {
  const navigate = useNavigate();

  const handleRegister = (eventId) => {
    navigate(`/register?event=${eventId}`);
  };

  return (
    <main className="relative min-h-[100dvh]" data-testid="events-root">
      <Waves
        lineColor="#7e8db7"
        backgroundColor="transparent"
        waveSpeedX={0.0125}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        className="opacity-40 pointer-events-none"
      />
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative pt-24 z-10"
      >
        <Events onRegister={handleRegister} />
      </motion.div>
      <Footer />
    </main>
  );
}
