import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, ShieldCheck, Terminal, LogOut, Minus } from "lucide-react";
import { SCHOOLS } from "./data";
import { API_ENDPOINTS } from "../../config";

const BOOT_LINES = [
  "rdv-os v3.14 ─ booting registration daemon...",
  "[ok] mounted /events  (5 nodes)",
  "[ok] crypto.handshake  256-bit",
  "[ok] queue.ready       slot allocated",
  "> awaiting operator input ▮",
];

const EVENT_FORM_CONFIG = [
  { id: "Melodia",          name: "MELODIA",        tagline: "BAND COMPETITION",   color: "#fc2c08", code: "01", description: "MIN 5 — MAX 10 MEMBERS" },
  { id: "game f",           name: "GAME F",          tagline: "GAMING COMPETITION", color: "#D9D2C4", code: "02", description: "2 TEAMS × 2 PLAYERS" },
  { id: "gourmet crusade",  name: "GOURMET CRUSADE", tagline: "COOK OFF",           color: "#5900ff", code: "03", description: "1 TEAM × 2 MEMBERS" },
  { id: "invogue",          name: "INVOGUE",         tagline: "FASHION × DESIGN",   color: "#66C7F4", code: "04", description: "2 MODELS + 4 DESIGNERS" },
  { id: "seismic",          name: "SEISMIC",         tagline: "DANCE COMPETITION",  color: "#D4E5FB", code: "05", description: "8–12 DANCERS + CHOREOGRAPHER" },
];

const validatePhone10 = (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
};

const blankStudent = () => ({ name: "", studentClass: "", phone: "" });
const blankTeacher = () => ({ name: "", phone: "" });
const patchAt = (arr, idx, field, value) =>
  arr.map((item, i) => (i === idx ? { ...item, [field]: value } : item));

const createInitialEventData = () => ({
  Melodia: { participating: true, members: Array.from({ length: 5 }, blankStudent) },
  "game f": { participating: true, teams: [Array.from({ length: 2 }, blankStudent)] },
  "gourmet crusade": { participating: true, members: Array.from({ length: 2 }, blankStudent) },
  invogue: {
    participating: true,
    models: [
      { model: blankStudent(), designers: [blankStudent(), blankStudent()] },
      { model: blankStudent(), designers: [blankStudent(), blankStudent()] },
    ],
  },
  seismic: { participating: true, members: Array.from({ length: 8 }, blankStudent), choreographer: { phone: "" } },
});

const inputCls =
  "w-full bg-white/5 border border-white/10 focus:border-[#fc2c08] outline-none px-4 py-3 font-mono-rdv text-sm text-white placeholder:text-white/10 uppercase transition-colors";

const smallInputCls =
  "w-full bg-white/5 border border-white/10 focus:border-[#fc2c08] outline-none px-3 py-2 font-mono-rdv text-[11px] text-white placeholder:text-white/10 uppercase transition-colors";

/* ── Reusable sub-row: name + class + phone ── */
function IndexedStudentRow({ index, student, onChange, onRemove, canRemove, placeholder }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="font-mono-rdv text-[10px] text-white/30 w-6 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <input
          value={student.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={placeholder || `MEMBER ${index + 1} NAME`}
          className={inputCls}
        />
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="text-[#fc2c08]/60 hover:text-[#fc2c08] transition-colors p-1 shrink-0">
            <Minus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex gap-2 ml-9">
        <input value={student.studentClass} onChange={(e) => onChange("studentClass", e.target.value)}
          placeholder="CLASS (e.g. 10)" className={`${smallInputCls} max-w-[120px]`} />
        <input value={student.phone || ""} onChange={(e) => onChange("phone", e.target.value)}
          placeholder="PHONE NUMBER" className={smallInputCls} />
      </div>
    </div>
  );
}

function LabeledStudentRow({ label, student, onChange, canRemove, onRemove }) {
  return (
    <div className="space-y-1.5 border-b border-white/[0.04] pb-3 sm:border-0 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <span className="font-mono-rdv text-[10px] text-white/30 w-20 shrink-0 uppercase">{label}</span>
        <div className="flex items-center gap-2 w-full">
          <input value={student.name} onChange={(e) => onChange("name", e.target.value)}
            placeholder="FULL NAME" className={inputCls} />
          {canRemove && (
            <button type="button" onClick={onRemove}
              className="text-[#fc2c08]/60 hover:text-[#fc2c08] transition-colors p-1 shrink-0">
              <Minus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-0 sm:ml-[5.5rem]">
        <input value={student.studentClass} onChange={(e) => onChange("studentClass", e.target.value)}
          placeholder="CLASS (e.g. 10)" className={`${smallInputCls} max-w-[120px]`} />
        <input value={student.phone || ""} onChange={(e) => onChange("phone", e.target.value)}
          placeholder="PHONE NUMBER" className={smallInputCls} />
      </div>
    </div>
  );
}

export default function Registration() {
  const [isVerified, setIsVerified]               = useState(false);
  const [schoolCode, setSchoolCode]               = useState("");
  const [schoolName, setSchoolName]               = useState("");
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [fetchingList, setFetchingList]           = useState(false);
  const [loading, setLoading]                     = useState(false);
  const [sessionId]                               = useState(() => Math.floor(Math.random() * 99999));

  const [eventData, setEventData]             = useState(createInitialEventData);
  const [expandedEvent, setExpandedEvent]     = useState("Melodia");
  const [foodCoupons, setFoodCoupons]         = useState({ veg: 0, nonVeg: 0 });
  const [nonParticipants, setNonParticipants] = useState([]);
  const [teachers, setTeachers]               = useState([]);

  const getParticipantCount = () => {
    let c = 0;
    const ev = eventData;
    if (ev.Melodia?.participating)            c += ev.Melodia.members.filter(m => m.name.trim()).length;
    if (ev["game f"]?.participating)          c += ev["game f"].teams.flat().filter(p => p.name.trim()).length;
    if (ev["gourmet crusade"]?.participating) c += ev["gourmet crusade"].members.filter(m => m.name.trim()).length;
    if (ev.invogue?.participating) ev.invogue.models.forEach(m => {
      if (m.model.name.trim()) c++;
      c += m.designers.filter(d => d.name.trim()).length;
    });
    if (ev.seismic?.participating) {
      c += ev.seismic.members.filter(m => m.name.trim()).length;
      if (ev.seismic.choreographer?.name.trim()) c++;
    }
    return c;
  };

  const updateNonParticipant = (idx, field, value) =>
    setNonParticipants(prev => patchAt(prev, idx, field, value));
  const addNonParticipant = () => {
    if (getParticipantCount() + nonParticipants.length >= 50) {
      toast.error("TOTAL SCHOOL DELEGATION CAP OF 50 REACHED");
      return;
    }
    setNonParticipants(prev => [...prev, blankStudent()]);
  };
  const removeNonParticipant = idx => setNonParticipants(prev => prev.filter((_, i) => i !== idx));

  const updateTeacher = (idx, field, value) => setTeachers(prev => patchAt(prev, idx, field, value));
  const addTeacher    = () => setTeachers(prev => {
    if (prev.length >= 4) return prev;
    return [...prev, blankTeacher()];
  });
  const removeTeacher = idx => setTeachers(prev => prev.filter((_, i) => i !== idx));

  const populateFormFromRegistrations = (regs) => {
    const fresh = createInitialEventData();
    Object.keys(fresh).forEach((k) => {
      fresh[k].participating = false;
    });

    let veg = 0;
    let nonVeg = 0;
    const nps = [];
    const tchs = [];

    regs.forEach((r) => {
      let cls = "";
      if (r.grade && r.grade !== "N/A" && r.grade !== "TEACHER") {
        cls = r.grade;
      }

      const phone = r.phone || "";
      const notes = r.notes || "";

      if (r.event_id === "non_participant") {
        if (r.full_name === "FOOD_COUPONS") {
          const vM = notes.match(/VEG:\s*(\d+)/i);
          const nvM = notes.match(/NON-VEG:\s*(\d+)/i);
          if (vM) veg = parseInt(vM[1], 10);
          if (nvM) nonVeg = parseInt(nvM[1], 10);
        } else if (r.grade === "TEACHER") {
          const m = notes.match(/Teacher\s+(\d+)/i);
          const idx = m ? parseInt(m[1], 10) - 1 : tchs.length;
          if (idx < 4) {
            while (tchs.length <= idx) {
              tchs.push(blankTeacher());
            }
            tchs[idx] = { name: r.full_name, phone: r.phone || "" };
          }
        } else {
          const m = notes.match(/Non-Participant\s+(\d+)/i);
          const idx = m ? parseInt(m[1], 10) - 1 : nps.length;
          while (nps.length <= idx) {
            nps.push(blankStudent());
          }
          nps[idx] = { name: r.full_name, studentClass: cls, phone };
        }
      } else {
        const evId = r.event_id;
        if (fresh[evId]) {
          fresh[evId].participating = true;
          if (evId === "Melodia" || evId === "gourmet crusade") {
            const m = notes.match(/Member\s+(\d+)/i);
            const idx = m ? parseInt(m[1], 10) - 1 : 0;
            while (fresh[evId].members.length <= idx) {
              fresh[evId].members.push(blankStudent());
            }
            fresh[evId].members[idx] = { name: r.full_name, studentClass: cls, phone };
          } else if (evId === "game f") {
            const m = notes.match(/Team\s+([A-B])\s+Player\s+(\d+)/i);
            if (m) {
              const ti = m[1].toUpperCase() === "A" ? 0 : 1;
              const pi = parseInt(m[2], 10) - 1;
              while (fresh["game f"].teams.length <= ti) {
                fresh["game f"].teams.push(Array.from({ length: 2 }, blankStudent));
              }
              fresh["game f"].teams[ti][pi] = { name: r.full_name, studentClass: cls, phone };
            }
          } else if (evId === "invogue") {
            const mM = notes.match(/Model\s+(\d+)/i);
            if (mM) {
              const mi = parseInt(mM[1], 10) - 1;
              const dM = notes.match(/Designer\s+([A-B])/i);
              if (dM) {
                const di = dM[1].toUpperCase() === "A" ? 0 : 1;
                fresh.invogue.models[mi].designers[di] = { name: r.full_name, studentClass: cls, phone };
              } else {
                fresh.invogue.models[mi].model = { name: r.full_name, studentClass: cls, phone };
              }
            }
          } else if (evId === "seismic") {
            if (notes.toLowerCase().includes("choreographer")) {
              fresh.seismic.choreographer = { phone: r.phone || "" };
            } else {
              const m = notes.match(/Dancer\s+(\d+)/i);
              const idx = m ? parseInt(m[1], 10) - 1 : 0;
              while (fresh.seismic.members.length <= idx) {
                fresh.seismic.members.push(blankStudent());
              }
              fresh.seismic.members[idx] = { name: r.full_name, studentClass: cls, phone };
            }
          }
        }
      }
    });

    setEventData(fresh);
    setFoodCoupons({ veg, nonVeg });
    setNonParticipants(nps);
    setTeachers(tchs.slice(0, 4));

    const active = Object.keys(fresh).filter((k) => fresh[k].participating);
    if (active.length > 0) {
      setExpandedEvent(active[0]);
    } else {
      setExpandedEvent("Melodia");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const normalizedCode = schoolCode.trim().toUpperCase();
    const matchedSchool  = SCHOOLS.find(s => s.code === normalizedCode);
    if (matchedSchool) {
      setIsVerified(true);
      setSchoolName(matchedSchool.name);
      toast.success("ACCESS GRANTED — SCHOOL VERIFIED");
      const regs = await fetchSchoolRegistrations(matchedSchool.name);
      if (regs && regs.length > 0) {
        populateFormFromRegistrations(regs);
        toast.info("LOADED PREVIOUS REGISTRATION DATA");
      }
    } else {
      toast.error("INVALID ACCESS CODE — ACCESS DENIED");
    }
  };

  const handleLogout = () => {
    setIsVerified(false); setSchoolCode(""); setSchoolName("");
    setRegisteredStudents([]); setEventData(createInitialEventData());
    setExpandedEvent("Melodia"); setFoodCoupons({ veg: 0, nonVeg: 0 });
    setNonParticipants([]); setTeachers([]);
    toast.info("SESSION DISCONNECTED");
  };

  const fetchSchoolRegistrations = async (school) => {
    setFetchingList(true);
    try {
      const res = await axios.get(API_ENDPOINTS.REGISTRATIONS, { params: { school } });
      setRegisteredStudents(res.data);
      return res.data;
    } catch { return []; }
    finally { setFetchingList(false); }
  };

  const participatingCount = Object.values(eventData).filter(e => e.participating).length;

  const toggleEvent = (evId) => {
    const willBeActive = !eventData[evId].participating;
    setEventData(prev => ({ ...prev, [evId]: { ...prev[evId], participating: willBeActive } }));
    if (!willBeActive && expandedEvent === evId) setExpandedEvent(null);
    else if (willBeActive) setExpandedEvent(evId);
  };
  const toggleExpanded = (evId) => {
    if (!eventData[evId].participating) return;
    setExpandedEvent(expandedEvent === evId ? null : evId);
  };

  const updateMember = (evId, idx, field, value) =>
    setEventData(prev => ({ ...prev, [evId]: { ...prev[evId], members: patchAt(prev[evId].members, idx, field, value) } }));
  const addMember = (evId, max) =>
    setEventData(prev => {
      if (prev[evId].members.length >= max) return prev;
      return { ...prev, [evId]: { ...prev[evId], members: [...prev[evId].members, blankStudent()] } };
    });
  const removeMember = (evId, idx, min) =>
    setEventData(prev => {
      if (prev[evId].members.length <= min) return prev;
      return { ...prev, [evId]: { ...prev[evId], members: prev[evId].members.filter((_, i) => i !== idx) } };
    });

  const updateGameFPlayer = (teamIdx, playerIdx, field, value) =>
    setEventData(prev => ({
      ...prev,
      "game f": {
        ...prev["game f"],
        teams: prev["game f"].teams.map((team, ti) =>
          ti === teamIdx ? patchAt(team, playerIdx, field, value) : team
        ),
      },
    }));

  const addGameFTeam = () =>
    setEventData(prev => {
      if (prev["game f"].teams.length >= 2) return prev;
      return {
        ...prev,
        "game f": {
          ...prev["game f"],
          teams: [...prev["game f"].teams, Array.from({ length: 2 }, blankStudent)]
        }
      };
    });

  const removeGameFTeam = () =>
    setEventData(prev => {
      if (prev["game f"].teams.length <= 1) return prev;
      return {
        ...prev,
        "game f": {
          ...prev["game f"],
          teams: prev["game f"].teams.slice(0, 1)
        }
      };
    });

  const updateInvogue = (modelIdx, field, value, designerIdx, subField) =>
    setEventData(prev => ({
      ...prev,
      invogue: {
        ...prev.invogue,
        models: prev.invogue.models.map((m, mi) => {
          if (mi !== modelIdx) return m;
          if (field === "model")    return { ...m, model: { ...m.model, [subField]: value } };
          if (field === "designer") return { ...m, designers: patchAt(m.designers, designerIdx, subField, value) };
          return m;
        }),
      },
    }));

  const updateChoreographer = (field, value) =>
    setEventData(prev => ({
      ...prev,
      seismic: { ...prev.seismic, choreographer: { ...prev.seismic.choreographer, [field]: value } },
    }));

  const handleSubmit = async () => {
    if (participatingCount < 4) { toast.error("MINIMUM 4 EVENTS REQUIRED FOR REGISTRATION"); return; }
    const participantCount      = getParticipantCount();
    const filledNonParticipants = nonParticipants.filter(n => n.name.trim()).length;
    const totalStudents         = participantCount + filledNonParticipants;
    if (totalStudents > 50) { toast.error(`TOTAL STUDENTS (${totalStudents}) EXCEEDS THE CAP OF 50`); return; }

    // Validate teachers
    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      if (t.name.trim()) {
        if (!validatePhone10(t.phone)) {
          toast.error(`TEACHER ${i + 1} ("${t.name}") REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
          return;
        }
      }
    }

    // Validate non-participants
    for (let i = 0; i < nonParticipants.length; i++) {
      const n = nonParticipants[i];
      if (n.name.trim()) {
        if (!validatePhone10(n.phone)) {
          toast.error(`NON-PARTICIPANT ${i + 1} ("${n.name}") REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
          return;
        }
      }
    }

    for (const config of EVENT_FORM_CONFIG) {
      const data = eventData[config.id];
      if (!data.participating) continue;
      switch (config.id) {
        case "Melodia": {
          const filled = data.members.filter(m => m.name.trim());
          if (filled.length < 5) {
            toast.error(`MELODIA REQUIRES AT LEAST 5 MEMBERS (${filled.length} PROVIDED)`);
            setExpandedEvent("Melodia");
            return;
          }
          for (let i = 0; i < data.members.length; i++) {
            const m = data.members[i];
            if (m.name.trim()) {
              if (!validatePhone10(m.phone)) {
                toast.error(`MELODIA MEMBER ${i + 1} REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
                setExpandedEvent("Melodia");
                return;
              }
            }
          }
          break;
        }
        case "game f": {
          const totalFilled = data.teams.flat().filter(p => p.name.trim()).length;
          if (totalFilled === 0) {
            toast.error("GAME F REQUIRES AT LEAST ONE TEAM (2 PLAYERS)");
            setExpandedEvent("game f");
            return;
          }
          for (let ti = 0; ti < data.teams.length; ti++) {
            const team = data.teams[ti];
            const filled = team.filter(p => p.name.trim());
            if (filled.length > 0 && filled.length < 2) {
              toast.error(`GAME F TEAM ${String.fromCharCode(65 + ti)} REQUIRES BOTH PLAYER NAMES`);
              setExpandedEvent("game f");
              return;
            }
            for (let pi = 0; pi < team.length; pi++) {
              const p = team[pi];
              if (p.name.trim()) {
                if (!validatePhone10(p.phone)) {
                  toast.error(`GAME F TEAM ${String.fromCharCode(65 + ti)} PLAYER ${pi + 1} REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
                  setExpandedEvent("game f");
                  return;
                }
              }
            }
          }
          break;
        }
        case "gourmet crusade": {
          const ok = data.members.every(m => m.name.trim());
          if (!ok) {
            toast.error("GOURMET CRUSADE REQUIRES BOTH MEMBER NAMES");
            setExpandedEvent("gourmet crusade");
            return;
          }
          for (let i = 0; i < data.members.length; i++) {
            const m = data.members[i];
            if (!validatePhone10(m.phone)) {
              toast.error(`GOURMET CRUSADE MEMBER ${i + 1} REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
              setExpandedEvent("gourmet crusade");
              return;
            }
          }
          break;
        }
        case "invogue": {
          const ok = data.models.every(m => m.model.name.trim() && m.designers.every(d => d.name.trim()));
          if (!ok) {
            toast.error("INVOGUE REQUIRES ALL MODEL AND DESIGNER NAMES");
            setExpandedEvent("invogue");
            return;
          }
          for (let mi = 0; mi < data.models.length; mi++) {
            const m = data.models[mi];
            if (!validatePhone10(m.model.phone)) {
              toast.error(`INVOGUE MODEL ${mi + 1} REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
              setExpandedEvent("invogue");
              return;
            }
            for (let di = 0; di < m.designers.length; di++) {
              const d = m.designers[di];
              if (!validatePhone10(d.phone)) {
                toast.error(`INVOGUE MODEL ${mi + 1} DESIGNER ${String.fromCharCode(65 + di)} REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
                setExpandedEvent("invogue");
                return;
              }
            }
          }
          break;
        }
        case "seismic": {
          const filled = data.members.filter(m => m.name.trim());
          if (filled.length < 8) {
            toast.error(`SEISMIC REQUIRES AT LEAST 8 DANCERS (${filled.length} PROVIDED)`);
            setExpandedEvent("seismic");
            return;
          }
          if (!data.choreographer.phone.trim()) {
            toast.error("SEISMIC REQUIRES A CHOREOGRAPHER PHONE NUMBER");
            setExpandedEvent("seismic");
            return;
          }
          if (!validatePhone10(data.choreographer.phone)) {
            toast.error("CHOREOGRAPHER REQUIRES A VALID 10-DIGIT PHONE NUMBER");
            setExpandedEvent("seismic");
            return;
          }
          for (let i = 0; i < data.members.length; i++) {
            const m = data.members[i];
            if (m.name.trim()) {
              if (!validatePhone10(m.phone)) {
                toast.error(`SEISMIC DANCER ${i + 1} REQUIRES A VALID 10-DIGIT PHONE NUMBER`);
                setExpandedEvent("seismic");
                return;
              }
            }
          }
          break;
        }
        default: break;
      }
    }

    const batch = [];
    const slug  = schoolName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const push  = (student, evId, role) =>
      batch.push({
        full_name: student.name.trim(),
        school:    schoolName,
        email:     `student${batch.length}@${slug}.com`,
        phone:     student.phone.trim(),
        grade:     student.studentClass || "N/A",
        event_id:  evId,
        notes:     `Role: ${role}`,
      });

    Object.entries(eventData).forEach(([evId, data]) => {
      if (!data.participating) return;
      if (evId === "Melodia" || evId === "gourmet crusade") {
        data.members.forEach((m, i) => { if (m.name.trim()) push(m, evId, `Member ${i + 1}`); });
      } else if (evId === "game f") {
        data.teams.forEach((team, ti) =>
          team.forEach((p, pi) => {
            if (p.name.trim()) push(p, evId, `Team ${String.fromCharCode(65 + ti)} Player ${pi + 1}`);
          })
        );
      } else if (evId === "invogue") {
        data.models.forEach((m, mi) => {
          if (m.model.name.trim()) push(m.model, evId, `Model ${mi + 1}`);
          m.designers.forEach((d, di) => {
            if (d.name.trim()) push(d, evId, `Model ${mi + 1} Designer ${String.fromCharCode(65 + di)}`);
          });
        });
      } else if (evId === "seismic") {
        if (data.choreographer.phone.trim()) {
          batch.push({
            full_name: "CHOREOGRAPHER",
            school:    schoolName,
            email:     `choreographer@${slug}.com`,
            phone:     data.choreographer.phone.trim(),
            grade:     "N/A",
            event_id:  evId,
            notes:     `Role: Choreographer`,
          });
        }
        data.members.forEach((m, i) => { if (m.name.trim()) push(m, evId, `Dancer ${i + 1}`); });
      }
    });

    nonParticipants.forEach((n, i) => { if (n.name.trim()) push(n, "non_participant", `Non-Participant ${i + 1}`); });

    teachers.forEach((t, i) => {
      if (t.name.trim())
        batch.push({
          full_name: t.name.trim(),
          school:    schoolName,
          email:     `teacher${i}@${slug}.com`,
          phone:     t.phone.trim(),
          grade:     "TEACHER",
          event_id:  "non_participant",
          notes:     `Role: Teacher ${i + 1}`,
        });
    });

    if (foodCoupons.veg > 0 || foodCoupons.nonVeg > 0) {
      batch.push({
        full_name: "FOOD_COUPONS",
        school:    schoolName,
        email:     `food@${slug}.com`,
        phone:     "0000000000",
        grade:     "N/A",
        event_id:  "non_participant",
        notes:     `Food Coupons — VEG: ${foodCoupons.veg}, NON-VEG: ${foodCoupons.nonVeg}, TOTAL: ${foodCoupons.veg + foodCoupons.nonVeg}`,
      });
    }

    if (batch.length === 0) { toast.error("NO ENTRIES TO SUBMIT"); return; }
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.REGISTRATIONS_BATCH, batch);
      toast.success(`REGISTRATION TRANSMITTED — ${batch.length} ENTRIES RECORDED`);
    } catch { toast.error("TRANSMISSION FAILED — PLEASE TRY AGAIN"); }
    finally { setLoading(false); }
  };

  const renderEventFields = (config) => {
    const data = eventData[config.id];
    switch (config.id) {

      case "Melodia":
        return (
          <div className="space-y-4">
            <div className="font-mono-rdv text-[10px] text-white/40 uppercase tracking-widest mb-4">-- BAND MEMBERS (MIN 5 / MAX 10) --</div>
            {data.members.map((member, i) => (
              <IndexedStudentRow key={i} index={i} student={member} placeholder={`MEMBER ${i + 1} NAME`}
                onChange={(f, v) => updateMember("Melodia", i, f, v)}
                onRemove={() => removeMember("Melodia", i, 5)} canRemove={data.members.length > 5} />
            ))}
            {data.members.length < 10 && (
              <button type="button" onClick={() => addMember("Melodia", 10)}
                className="flex items-center gap-2 font-mono-rdv text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-2 border border-dashed border-white/10 hover:border-white/30 w-full py-3 justify-center">
                <Plus className="w-3.5 h-3.5" /> ADD MEMBER ({data.members.length}/10)
              </button>
            )}
          </div>
        );

      case "game f":
        return (
          <div className="space-y-6">
            {data.teams.map((team, ti) => (
              <div key={ti} className="relative border-b border-white/[0.04] pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono-rdv text-[10px] uppercase tracking-widest" style={{ color: config.color }}>
                    -- TEAM {String.fromCharCode(65 + ti)} --
                  </div>
                  {ti === 1 && (
                    <button type="button" onClick={removeGameFTeam}
                      className="text-[#fc2c08]/60 hover:text-[#fc2c08] font-mono-rdv text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors">
                      <Minus className="w-3.5 h-3.5" /> REMOVE TEAM B
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {team.map((player, pi) => (
                    <LabeledStudentRow key={pi} label={`PLAYER ${pi + 1}`} student={player}
                      onChange={(f, v) => updateGameFPlayer(ti, pi, f, v)} canRemove={false} />
                  ))}
                </div>
              </div>
            ))}
            {data.teams.length < 2 && (
              <button type="button" onClick={addGameFTeam}
                className="flex items-center gap-2 font-mono-rdv text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-2 border border-dashed border-white/10 hover:border-white/30 w-full py-3 justify-center">
                <Plus className="w-3.5 h-3.5" /> ADD TEAM B
              </button>
            )}
          </div>
        );

      case "gourmet crusade":
        return (
          <div className="space-y-4">
            <div className="font-mono-rdv text-[10px] text-white/40 uppercase tracking-widest mb-4">-- TEAM MEMBERS (2 REQUIRED) --</div>
            {data.members.map((member, i) => (
              <LabeledStudentRow key={i} label={`MEMBER ${i + 1}`} student={member}
                onChange={(f, v) => updateMember("gourmet crusade", i, f, v)} canRemove={false} />
            ))}
          </div>
        );

      case "invogue":
        return (
          <div className="space-y-6">
            {data.models.map((m, mi) => (
              <div key={mi}>
                <div className="font-mono-rdv text-[10px] uppercase tracking-widest mb-3" style={{ color: config.color }}>
                  -- MODEL {mi + 1} SET --
                </div>
                <div className="space-y-4">
                  <LabeledStudentRow label={`MODEL ${mi + 1}`} student={m.model}
                    onChange={(f, v) => updateInvogue(mi, "model", v, undefined, f)} canRemove={false} />
                  {m.designers.map((d, di) => (
                    <div key={di} className="ml-4 border-l border-white/[0.06] pl-4">
                      <LabeledStudentRow label={`DSGN ${di + 1}`} student={d}
                        onChange={(f, v) => updateInvogue(mi, "designer", v, di, f)} canRemove={false} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "seismic":
        return (
          <div className="space-y-4">
            <div className="font-mono-rdv text-[10px] text-white/40 uppercase tracking-widest mb-2">-- CHOREOGRAPHER --</div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b border-white/[0.04] pb-3 sm:border-0 sm:pb-0">
              <span className="font-mono-rdv text-[10px] text-white/30 w-20 shrink-0 uppercase">CHOREO. PHONE</span>
              <input value={data.choreographer.phone || ""} onChange={(e) => updateChoreographer("phone", e.target.value)}
                placeholder="PHONE NUMBER" className={inputCls} />
            </div>
            <div className="font-mono-rdv text-[10px] text-white/40 uppercase tracking-widest mb-2 pt-4">-- DANCE CREW (MIN 8 / MAX 12) --</div>
            {data.members.map((member, i) => (
              <IndexedStudentRow key={i} index={i} student={member} placeholder={`DANCER ${i + 1} NAME`}
                onChange={(f, v) => updateMember("seismic", i, f, v)}
                onRemove={() => removeMember("seismic", i, 8)} canRemove={data.members.length > 8} />
            ))}
            {data.members.length < 12 && (
              <button type="button" onClick={() => addMember("seismic", 12)}
                className="flex items-center gap-2 font-mono-rdv text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-2 border border-dashed border-white/10 hover:border-white/30 w-full py-3 justify-center">
                <Plus className="w-3.5 h-3.5" /> ADD DANCER ({data.members.length}/12)
              </button>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <section id="register" className="relative px-4 md:px-8 py-24 md:py-32" data-testid="registration-section">
      <div className="max-w-[1400px] mx-auto">
        {!isVerified ? (
          <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
            <div className="lg:col-span-4">
              <div className="font-mono-rdv text-xs text-[#66C7F4] dark:text-[#D4E5FB] uppercase tracking-widest mb-3">
                §03 -- ENROLL_PROTOCOL
              </div>
              <h2 className="font-display text-5xl md:text-7xl leading-[0.9]">
                <span className="text-chrome">CLAIM</span>{" "}
                <span className="text-stroke-acid">YOUR</span>
                <br />
                <span className="text-[#fc2c08]">SLOT.</span>
              </h2>
              <p className="font-mono-rdv text-sm text-[#1C1C2E]/75 dark:text-[#D4E5FB]/60 mt-6 max-w-md leading-relaxed">
                &gt; Authorized registration only. Each school is assigned a unique access code.
                Please contact the RDV admin if your code is missing.
              </p>
              <div className="mt-8 relative bg-[#1C1C2E] border border-[#fc2c08]/40 p-4 md:p-5 scanlines crt-flicker">
                <div className="flex items-center gap-2 mb-3 font-mono-rdv text-[10px] text-[#fc2c08] uppercase tracking-widest">
                  <span className="w-2 h-2 bg-[#fc2c08] inline-block" />
                  <span className="w-2 h-2 bg-[#fc2c08] inline-block" />
                  <Terminal className="w-3 h-3 ml-2" />
                  <span className="ml-1">auth_daemon.log</span>
                </div>
                <div className="font-mono-rdv text-xs text-[#fc2c08] leading-6 min-h-[120px]">
                  {BOOT_LINES.slice(0, 3).map((l, i) => (
                    <div key={i} className="boot-line">{l}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="relative bg-[#0A0A0A] border border-[#fc2c08]/20 p-6 md:p-8 scanlines overflow-hidden shadow-brutal-pink">
                <div className="absolute top-0 right-0 p-2 opacity-5"><ShieldCheck size={120} /></div>
                <div className="max-w-md mx-auto py-12 text-center">
                  <ShieldCheck className="w-16 h-16 text-[#fc2c08] mx-auto mb-6 animate-pulse" />
                  <h3 className="font-display text-4xl text-white mb-4">SECURITY CHECK</h3>
                  <p className="font-mono-rdv text-sm text-white/50 mb-8">
                    PLEASE ENTER YOUR OFFICIAL SCHOOL ACCESS CODE TO PROCEED WITH REGISTRATION.
                  </p>
                  <form onSubmit={handleVerify} className="space-y-4">
                    <input required type="password" value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)} placeholder="ENTER_SCHOOL_CODE"
                      className="w-full bg-black border-2 border-[#fc2c08]/40 focus:border-[#fc2c08] outline-none px-6 py-4 font-mono-rdv text-lg md:text-2xl text-center text-[#fc2c08] tracking-[0.2em] md:tracking-[0.5em] placeholder:text-xs md:placeholder:text-sm placeholder:text-white/10" />
                    <button type="submit" className="w-full bg-[#fc2c08] text-black font-display text-xl py-4 hover:tracking-widest transition-all">
                      VERIFY IDENTITY →
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* DASHBOARD HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0A0A0A] border border-[#fc2c08]/40 p-4 md:p-6 shadow-brutal-pink scanlines">
              <div>
                <div className="font-mono-rdv text-xs text-[#fc2c08] uppercase tracking-widest mb-1.5">
                  ◆ OPERATOR_SESSION // SESSION_{sessionId}
                </div>
                <h2 className="font-display text-2xl md:text-4xl text-white">{schoolName.toUpperCase()}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right font-mono-rdv text-[10px] text-white/40 uppercase">
                  <div>ACCESS LEVEL: AUTHORIZED</div>
                  <div>CODE: {schoolCode}</div>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 border border-[#fc2c08] text-[#fc2c08] hover:bg-[#fc2c08] hover:text-black transition-colors px-4 py-2 font-mono-rdv text-xs uppercase tracking-widest">
                  <LogOut className="w-4 h-4" /> DISCONNECT
                </button>
              </div>
            </div>

            {/* EVENT STATUS BAR */}
            <div className={`bg-[#0A0A0A] border p-4 md:p-5 scanlines ${participatingCount >= 4 ? "border-emerald-500/40" : "border-[#fc2c08]/40"}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-white/60" />
                  <span className="font-mono-rdv text-xs text-white/60 uppercase tracking-widest">§EVENT_REGISTRATION</span>
                </div>
                <div className={`font-mono-rdv text-xs uppercase tracking-widest ${participatingCount >= 4 ? "text-emerald-400" : "text-[#fc2c08]"}`}>
                  {participatingCount}/5 EVENTS SELECTED
                  {participatingCount >= 4 ? " ✓ READY" : ` — ${4 - participatingCount} MORE REQUIRED`}
                </div>
              </div>
              <div className="mt-3 h-1 bg-white/5 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${participatingCount >= 4 ? "bg-emerald-500" : "bg-[#fc2c08]"}`}
                  style={{ width: `${(participatingCount / 5) * 100}%` }} />
              </div>
              <p className="font-mono-rdv text-[10px] text-white/30 uppercase tracking-widest mt-3">
                &gt; Each school must participate in at least 4 out of 5 events. Toggle events on/off and fill in team rosters below.
              </p>
            </div>

            {/* EVENT ACCORDION */}
            <div className="space-y-3">
              {EVENT_FORM_CONFIG.map((config) => {
                const data       = eventData[config.id];
                const isExpanded = expandedEvent === config.id;
                return (
                  <div key={config.id}
                    className={`bg-[#0A0A0A] border overflow-hidden scanlines transition-all duration-300 ${data.participating ? "border-white/[0.12] shadow-brutal" : "border-white/[0.04] opacity-50"}`}
                    style={{ borderLeftWidth: "3px", borderLeftColor: data.participating ? config.color : "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between p-4 md:p-5 cursor-pointer select-none hover:bg-white/[0.015] transition-colors"
                      onClick={() => toggleExpanded(config.id)}>
                      <div className="flex items-center gap-3 min-w-0 flex-wrap">
                        <span className="font-mono-rdv text-[10px] tracking-widest shrink-0"
                          style={{ color: data.participating ? config.color : "rgba(255,255,255,0.2)" }}>
                          §{config.code}
                        </span>
                        <h3 className={`font-display text-base md:text-xl shrink-0 ${data.participating ? "text-white" : "text-white/25 line-through"}`}>
                          {config.name}
                        </h3>
                        <span className="hidden sm:inline font-mono-rdv text-[10px] text-white/25 uppercase tracking-widest">{config.tagline}</span>
                        <span className="hidden lg:inline font-mono-rdv text-[9px] uppercase tracking-widest px-2 py-0.5 border"
                          style={{
                            color:           data.participating ? config.color : "rgba(255,255,255,0.15)",
                            borderColor:     data.participating ? `${config.color}30` : "rgba(255,255,255,0.06)",
                            backgroundColor: data.participating ? `${config.color}08` : "transparent",
                          }}>
                          {config.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); toggleEvent(config.id); }}
                          className="px-3 py-1.5 border font-mono-rdv text-[10px] uppercase tracking-widest transition-all hover:scale-105"
                          style={{
                            borderColor:     data.participating ? config.color : "rgba(255,255,255,0.12)",
                            backgroundColor: data.participating ? `${config.color}15` : "transparent",
                            color:           data.participating ? config.color : "rgba(255,255,255,0.25)",
                          }}>
                          {data.participating ? "● ENROLL" : "○ SKIP"}
                        </button>
                        {data.participating && (
                          <span className="text-white/20 text-xs">{isExpanded ? "▼" : "▶"}</span>
                        )}
                      </div>
                    </div>
                    {isExpanded && data.participating && (
                      <div className="px-4 md:px-6 pb-6 border-t border-white/[0.06] pt-5 animate-[fadeIn_0.2s_ease-out]">
                        {renderEventFields(config)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* NON-PARTICIPANTS */}
            <div className="bg-[#0A0A0A] border border-white/[0.12] p-6 md:p-8 scanlines shadow-brutal"
              style={{ borderLeftWidth: "3px", borderLeftColor: "#FFFFFF" }}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <div className="flex items-center gap-2 font-mono-rdv text-xs text-white uppercase tracking-widest">
                  <Terminal className="w-4 h-4" /> §NON_PARTICIPANTS
                </div>
                <div className={`font-mono-rdv text-xs uppercase tracking-widest ${getParticipantCount() + nonParticipants.length > 50 ? "text-[#fc2c08]" : "text-white/60"}`}>
                  TOTAL DELEGATION: {getParticipantCount() + nonParticipants.length}/50
                </div>
              </div>
              <p className="font-mono-rdv text-[10px] text-white/30 uppercase tracking-widest mb-6">
                &gt; Students attending as spectators/supporters. Included in the 50-student cap.
                Capacity remaining: {Math.max(0, 50 - getParticipantCount() - nonParticipants.length)} students.
              </p>
              <div className="space-y-4">
                {nonParticipants.map((np, i) => (
                  <IndexedStudentRow key={i} index={i} student={np} placeholder={`NON-PARTICIPANT ${i + 1} NAME`}
                    onChange={(f, v) => updateNonParticipant(i, f, v)}
                    onRemove={() => removeNonParticipant(i)} canRemove={true} />
                ))}
                {getParticipantCount() + nonParticipants.length < 50 && (
                  <button type="button" onClick={addNonParticipant}
                    className="flex items-center gap-2 font-mono-rdv text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-2 border border-dashed border-white/10 hover:border-white/30 w-full py-3 justify-center">
                    <Plus className="w-3.5 h-3.5" /> ADD NON-PARTICIPANT ({nonParticipants.length} ADDED)
                  </button>
                )}
              </div>
            </div>

            {/* TEACHERS */}
            <div className="bg-[#0A0A0A] border border-white/[0.12] p-6 md:p-8 scanlines shadow-brutal"
              style={{ borderLeftWidth: "3px", borderLeftColor: "#F6D8A8" }}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <div className="flex items-center gap-2 font-mono-rdv text-xs uppercase tracking-widest" style={{ color: "#F6D8A8" }}>
                  <Terminal className="w-4 h-4" /> §TEACHERS / ESCORTS
                </div>
                <div className="font-mono-rdv text-xs text-white/40 uppercase tracking-widest">
                  {teachers.filter(t => t.name.trim()).length} TEACHER{teachers.filter(t => t.name.trim()).length !== 1 ? "S" : ""} ADDED
                </div>
              </div>
              <p className="font-mono-rdv text-[10px] text-white/30 uppercase tracking-widest mb-6">
                &gt; Accompanying teachers or escorts. Not counted towards the 50-student cap.
              </p>
              <div className="space-y-4">
                {teachers.map((teacher, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-rdv text-[10px] text-white/30 w-6 shrink-0">
                        {String(i + 1).padStart(2, "00")}
                      </span>
                      <input value={teacher.name} onChange={(e) => updateTeacher(i, "name", e.target.value)}
                        placeholder={`TEACHER ${i + 1} NAME`} className={inputCls} />
                      <button type="button" onClick={() => removeTeacher(i)}
                        className="text-[#fc2c08]/60 hover:text-[#fc2c08] transition-colors p-1 shrink-0">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="ml-9">
                      <input value={teacher.phone} onChange={(e) => updateTeacher(i, "phone", e.target.value)}
                        placeholder="CONTACT NUMBER" className={smallInputCls} />
                    </div>
                  </div>
                ))}
                {teachers.length < 4 && (
                  <button type="button" onClick={addTeacher}
                    className="flex items-center gap-2 font-mono-rdv text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-2 border border-dashed border-white/10 hover:border-white/30 w-full py-3 justify-center">
                    <Plus className="w-3.5 h-3.5" /> ADD TEACHER ({teachers.length}/4 ADDED)
                  </button>
                )}
              </div>
            </div>

            {/* FOOD COUPONS */}
            <div className="bg-[#0A0A0A] border border-white/[0.12] p-6 md:p-8 scanlines shadow-brutal"
              style={{ borderLeftWidth: "3px", borderLeftColor: "#22c55e" }}>
              <div className="flex items-center gap-2 font-mono-rdv text-xs text-emerald-400 uppercase tracking-widest mb-2">
                <Terminal className="w-4 h-4" /> §FOOD_COUPONS
              </div>
              <p className="font-mono-rdv text-[10px] text-white/30 uppercase tracking-widest mb-6">
                &gt; Enter the total number of students who require VEG and NON-VEG food coupons.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block font-mono-rdv text-[10px] text-white/50 mb-1.5 uppercase tracking-widest">VEG COUNT</label>
                  <input type="number" min="0" value={foodCoupons.veg || ""}
                    onChange={(e) => setFoodCoupons(prev => ({ ...prev, veg: parseInt(e.target.value) || 0 }))}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="block font-mono-rdv text-[10px] text-white/50 mb-1.5 uppercase tracking-widest">NON-VEG COUNT</label>
                  <input type="number" min="0" value={foodCoupons.nonVeg || ""}
                    onChange={(e) => setFoodCoupons(prev => ({ ...prev, nonVeg: parseInt(e.target.value) || 0 }))}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="block font-mono-rdv text-[10px] text-emerald-400/60 mb-1.5 uppercase tracking-widest">TOTAL COUPONS</label>
                  <div className="bg-white/[0.03] border border-emerald-500/20 px-4 py-3 font-mono-rdv text-sm text-emerald-400 uppercase tracking-wider">
                    {foodCoupons.veg + foodCoupons.nonVeg} COUPONS
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <div className="pt-2">
              <button type="button" onClick={handleSubmit} disabled={loading || participatingCount < 4}
                className={`w-full font-display text-lg md:text-xl py-5 transition-all duration-300 disabled:cursor-not-allowed ${
                  participatingCount >= 4
                    ? "bg-[#fc2c08] text-black hover:tracking-widest hover:bg-white disabled:opacity-60"
                    : "bg-white/[0.06] text-white/20 disabled:opacity-100"
                }`}>
                {loading
                  ? "▶ TRANSMITTING..."
                  : participatingCount >= 4
                  ? "▶ TRANSMIT REGISTRATION"
                  : `SELECT ${4 - participatingCount} MORE EVENT${4 - participatingCount > 1 ? "S" : ""} TO PROCEED`}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
