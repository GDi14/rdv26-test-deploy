import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FAQ, FESTIVAL } from "./data";
import { API_ENDPOINTS } from "../../config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Instagram, Youtube, Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.CONTACT, form);
      toast.success("MESSAGE TRANSMITTED");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error("FAILED — RETRY");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative px-4 md:px-8 py-24 md:py-32"
      data-testid="contact-section"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="font-mono-rdv text-xs text-[#3A50A0] dark:text-[#7B8DB7] uppercase tracking-widest mb-3">
          §04 ── COMMS_CHANNEL
        </div>
        <h2 className="font-display text-6xl md:text-9xl leading-[0.85]">
          <span className="text-stroke-white">SAY</span>{" "}
          <span className="text-[#fc2c08]">HI.</span>
        </h2>

        <div className="mt-12 md:mt-20 grid lg:grid-cols-12 gap-8 md:gap-12">
          {/* contact info */}
          <div className="lg:col-span-5 space-y-6">
            <InfoRow
              icon={<MapPin className="w-5 h-5" />}
              label="VENUE"
              value={`${FESTIVAL.venue} // ${FESTIVAL.city}`}
              testid="info-venue"
            />
            <InfoRow
              icon={<Mail className="w-5 h-5" />}
              label="EMAIL"
              value="rendezvous@svke033.in"
              testid="info-email"
            />
            <InfoRow
              icon={<Phone className="w-5 h-5" />}
              label="HOTLINE"
              value="+91 82819 95645"
              testid="info-phone"
            />

            <div className="pt-4 border-t border-[#1C1C2E]/15 dark:border-[#F0EDE6]/10">
              <div className="font-mono-rdv text-xs uppercase text-[#1C1C2E]/60 dark:text-[#F0EDE6]/45 mb-3 tracking-widest">
                ◆ FOLLOW THE NOISE
              </div>
              <div className="flex flex-wrap gap-3">
                <SocialBtn icon={<Instagram className="w-4 h-4" />} label="INSTAGRAM" id="social-instagram" />
                <SocialBtn icon={<Youtube className="w-4 h-4" />} label="YOUTUBE" id="social-youtube" />
              </div>
            </div>

            <div className="pt-4 border-t border-[#1C1C2E]/15 dark:border-[#F0EDE6]/10">
              <div className="font-mono-rdv text-xs uppercase text-[#1C1C2E]/60 dark:text-[#F0EDE6]/45 mb-3 tracking-widest">
                ◆ FAQ
              </div>
              <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
                {FAQ.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-b border-[#1C1C2E]/15 dark:border-[#F0EDE6]/10"
                    data-testid={`faq-item-${i}`}
                  >
                    <AccordionTrigger className="font-mono-rdv text-sm uppercase tracking-widest text-[#1C1C2E] dark:text-[#F0EDE6] hover:text-[#3A50A0] dark:hover:text-[#7B8DB7] hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-sm text-[#1C1C2E]/75 dark:text-[#F0EDE6]/65 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* contact form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={submit}
              className="grid md:grid-cols-2 gap-5 bg-[#F0EDE6] dark:bg-[#1E1D2E] border border-[#1C1C2E]/25 dark:border-[#F0EDE6]/10 p-6 md:p-8 shadow-brutal-pink"
              data-testid="contact-form"
            >
              <FF label="NAME">
                <input
                  required
                  value={form.name}
                  onChange={setField("name")}
                  data-testid="contact-name"
                  className={ccls}
                />
              </FF>
              <FF label="EMAIL">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  data-testid="contact-email"
                  className={ccls}
                />
              </FF>
              <div className="md:col-span-2">
                <FF label="SUBJECT">
                  <input
                    required
                    value={form.subject}
                    onChange={setField("subject")}
                    data-testid="contact-subject"
                    className={ccls}
                  />
                </FF>
              </div>
              <div className="md:col-span-2">
                <FF label="MESSAGE">
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={setField("message")}
                    data-testid="contact-message"
                    className={ccls + " resize-none"}
                  />
                </FF>
              </div>
              <div className="md:col-span-2 flex items-center justify-between flex-wrap gap-4">
                <span className="font-mono-rdv text-[10px] text-[#1C1C2E]/55 dark:text-[#F0EDE6]/45 uppercase tracking-widest">
                  &gt; we usually reply within 48 hrs
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="contact-submit"
                  className="inline-flex items-center gap-2 bg-[#3A50A0] text-white font-display text-lg px-6 py-3 shadow-brutal hover:translate-x-[-3px] hover:translate-y-[-3px] transition-transform disabled:opacity-50"
                >
                  {loading ? "SENDING…" : "▶ TRANSMIT"} <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

const ccls =
  "w-full bg-[#E8E4DC] dark:bg-[#14131C] border border-[#1C1C2E]/30 dark:border-[#F0EDE6]/15 focus:border-[#3A50A0] dark:focus:border-[#7B8DB7] outline-none px-3 py-2.5 font-mono-rdv text-sm text-[#1C1C2E] dark:text-[#F0EDE6] placeholder:text-[#1C1C2E]/40 dark:placeholder:text-[#F0EDE6]/30 rounded-none transition-colors";

function FF({ label, children }) {
  return (
    <label className="block">
      <span className="block font-mono-rdv text-[10px] uppercase tracking-widest text-[#1C1C2E]/65 dark:text-[#F0EDE6]/50 mb-1.5">
        ◆ {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({ icon, label, value, testid }) {
  return (
    <div className="flex items-start gap-4 border border-[#1C1C2E]/20 dark:border-[#F0EDE6]/10 bg-[#F0EDE6] dark:bg-[#1E1D2E] p-4" data-testid={testid}>
      <div className="text-[#3A50A0] dark:text-[#7B8DB7]">{icon}</div>
      <div>
        <div className="font-mono-rdv text-[10px] uppercase tracking-widest text-[#1C1C2E]/55 dark:text-[#F0EDE6]/45">
          {label}
        </div>
        <div className="font-display text-lg md:text-xl text-[#1C1C2E] dark:text-[#F0EDE6]">{value}</div>
      </div>
    </div>
  );
}

function SocialBtn({ icon, label, id }) {
  return (
    <a
      href="#"
      data-testid={id}
      className="inline-flex items-center gap-2 border border-[#1C1C2E]/30 dark:border-[#F0EDE6]/20 text-[#1C1C2E] dark:text-[#F0EDE6] hover:border-[#fc2c08] hover:text-[#fc2c08] dark:hover:border-[#fc2c08] dark:hover:text-[#fc2c08] px-3 py-2 font-mono-rdv text-xs uppercase tracking-widest transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}
