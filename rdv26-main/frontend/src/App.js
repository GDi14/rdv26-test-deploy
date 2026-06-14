import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import EventsPage from "@/pages/EventsPage";
import RegisterPage from "@/pages/RegisterPage";
import ContactPage from "@/pages/ContactPage";
import GalleryPage from "@/pages/GalleryPage";
import CustomCursor from "@/components/rdv/CustomCursor";
import ScanlineOverlay from "@/components/rdv/ScanlineOverlay";

function App() {
  return (
    <div className="App">
      <ScanlineOverlay />
      <CustomCursor />
      <Toaster
        theme="light"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#FFFDF6",
            color: "#0A0A0A",
            border: "1px solid #0A0A0A",
            borderRadius: 0,
            fontFamily: "JetBrains Mono, monospace",
            boxShadow: "4px 4px 0 0 #FF2E88",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Home />}         />
          <Route path="/events"   element={<EventsPage />}   />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/contact"  element={<ContactPage />}  />
          <Route path="/gallery"  element={<GalleryPage />}  />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

