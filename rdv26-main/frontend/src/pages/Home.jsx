import Navbar from "@/components/rdv/Navbar";
import Hero from "@/components/rdv/Hero";
import Footer from "@/components/rdv/Footer";

export default function Home() {
  return (
    <main className="relative" data-testid="home-root">
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
}

