import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/rdv/Navbar";
import Registration from "@/components/rdv/Registration";
import Footer from "@/components/rdv/Footer";
import Waves from "@/components/rdv/Waves";
import { EVENTS } from "@/components/rdv/data";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();

  const initialEventId = searchParams.get("event") || EVENTS[0].id;
  const [eventId, setEventId] = useState(initialEventId);

  return (
    <main className="relative min-h-screen" data-testid="register-root">
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative pt-24 z-10"
      >
        <Registration eventId={eventId} onChangeEvent={setEventId} />
      </motion.div>
      <Footer />
    </main>
  );
}
