import Navbar from "@/components/rdv/Navbar";
import Contact from "@/components/rdv/Contact";
import Footer from "@/components/rdv/Footer";
import Waves from "@/components/rdv/Waves";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main className="relative min-h-[100dvh]" data-testid="contact-root">
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
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative pt-24 z-10"
      >
        <Contact />
      </motion.div>
      <Footer />
    </main>
  );
}
