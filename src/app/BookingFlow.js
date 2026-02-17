"use client";
import { useState, useEffect } from "react";

// Calls our own Next.js API route (avoids CORS — server talks to Apps Script)
const API = "/api/booking";

function getBookingDays() {
  const days = [];
  const now = new Date();
  // today + tomorrow + day after tomorrow
  for (let i = 0; i <= 2; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDay(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function slotKey(dayIndex, slotId, days) {
  return `${days[dayIndex].toISOString().split("T")[0]}_${slotId}`;
}

const SLOTS = [
  { id: "morning",  label: "Morning Session",   time: "7:00 AM – 8:00 AM", icon: "🌅", period: "morning" },
  { id: "evening1", label: "Evening Session 1",  time: "7:00 PM – 8:00 PM", icon: "🌆", period: "evening" },
  { id: "evening2", label: "Evening Session 2",  time: "8:00 PM – 9:00 PM", icon: "🌙", period: "evening" },
];

export default function FitnessApp() {
  const [page, setPage]               = useState("form");
  const [answers, setAnswers]         = useState({ q1: "", q2: "", q3: "" });
  const [name, setName]               = useState("");
  const [whatsapp, setWhatsapp]       = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]); // ["2025-02-18_morning", ...]
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const days = getBookingDays();

  const questions = [
    { id: "q1", text: "Do you realize that when a member quits after 4 months, you lose 8 months of profit?" },
    { id: "q2", text: "Are you ready to keep working this hard every day for the next 5 years?" },
    { id: "q3", text: "Do you think your business is safe if you keep doing the same thing for 5 years?" },
  ];

  // Fetch existing bookings when landing on booking page
  useEffect(() => {
    if (page !== "booking") return;
    setLoadingSlots(true);
    fetch(`${API}?action=getBookings`)
      .then(r => r.json())
      .then(data => {
        setBookedSlots(data.booked || []);
        setLoadingSlots(false);
      })
      .catch(() => setLoadingSlots(false));
  }, [page]);

  const handleSchedule = () => {
    if (!name.trim() || !whatsapp.trim()) return;
    setPage("booking");
    window.scrollTo(0, 0);
  };

  const handleConfirm = async () => {
    if (selectedDay === null || !selectedSlot) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        action: "book",
        name,
        whatsapp,
        date: days[selectedDay].toISOString().split("T")[0],
        dateLabel: formatDay(days[selectedDay]),
        slotId: selectedSlot,
        slotTime: SLOTS.find(s => s.id === selectedSlot)?.time,
        answers: JSON.stringify(answers),
      };
      const res = await fetch(API, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setConfirmed(true);
      } else if (data.status === "taken") {
        setError("⚠️ This slot was just booked by someone else. Please pick another.");
        setBookedSlots(prev => [...prev, slotKey(selectedDay, selectedSlot, days)]);
        setSelectedSlot(null);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const chosenSlot = SLOTS.find(s => s.id === selectedSlot);

  const isBooked = (dayIdx, slotId) => {
    const targetKey = slotKey(dayIdx, slotId, days);
    return bookedSlots.some(entry => {
      // entry might be "Tue Feb 17 2026 00:00:00 GMT+0530 (India Standard Time)_morning"
      // Split on last underscore to separate date part from slotId
      const lastUnderscore = entry.lastIndexOf("_");
      const datePart = entry.substring(0, lastUnderscore);
      const slotPart = entry.substring(lastUnderscore + 1);

      // Normalize datePart to YYYY-MM-DD
      let normalized;
      const parsed = new Date(datePart);
      if (!isNaN(parsed)) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        normalized = `${y}-${m}-${d}`;
      } else {
        normalized = datePart; // already YYYY-MM-DD or unknown
      }

      return `${normalized}_${slotPart}` === targetKey;
    });
  };

  const isDayFullyBooked = (dayIdx) =>
    SLOTS.every(slot => isBooked(dayIdx, slot.id));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Nunito:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #edeaf5; min-height: 100vh; font-family: 'Nunito', sans-serif; }

        .page-wrapper {
          max-width: 520px; margin: 0 auto; min-height: 100vh; background: #f8f7fc;
        }
        @media (min-width: 640px) {
          body { display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; }
          .page-wrapper { min-height: unset; border-radius: 24px; overflow: hidden;
            box-shadow: 0 20px 60px rgba(91,33,182,0.15), 0 4px 16px rgba(0,0,0,0.08); }
        }

        /* HERO */
        .hero {
          background: linear-gradient(160deg, #3b1278 0%, #5b21b6 40%, #4c1d95 70%, #2d0a6e 100%);
          padding: 48px 28px 36px; text-align: center; position: relative; overflow: hidden;
        }
        .hero::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.3) 0%, transparent 50%);
        }
        .hero-badge {
          display:inline-block; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25);
          border-radius:20px; padding:4px 14px; font-size:10px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.85); margin-bottom:16px;
        }
        .hero h1 {
          font-family:'Montserrat',sans-serif; font-weight:900; font-size:28px;
          line-height:1.15; color:white; margin-bottom:10px; position:relative;
        }
        .hero-sub { font-size:13.5px; color:rgba(255,255,255,0.7); font-weight:500; position:relative; }

        /* FORM */
        .form-body { background:#f8f7fc; padding:24px 18px 32px; display:flex; flex-direction:column; gap:14px; }
        .question-card {
          background:white; border-radius:18px; padding:18px 18px 14px;
          box-shadow:0 2px 12px rgba(91,33,182,0.08),0 1px 3px rgba(0,0,0,0.04);
          border:1px solid rgba(139,92,246,0.1);
        }
        .question-text { font-family:'Montserrat',sans-serif; font-weight:700; font-size:13.5px; color:#1a0a2e; line-height:1.4; margin-bottom:14px; }
        .question-num { color:#7c3aed; }
        .radio-group { display:flex; flex-direction:column; gap:8px; }
        .radio-label { display:flex; align-items:center; gap:10px; cursor:pointer; font-size:14px; font-weight:600; color:#2d1b5e; padding:2px 0; transition:color 0.15s; }
        .radio-label:hover { color:#7c3aed; }
        .radio-custom { width:20px; height:20px; border-radius:50%; border:2px solid #c4b5fd; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:white; }
        .radio-label.checked .radio-custom { border-color:#7c3aed; }
        .radio-dot { width:10px; height:10px; border-radius:50%; background:#7c3aed; opacity:0; transform:scale(0); transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .radio-label.checked .radio-dot { opacity:1; transform:scale(1); }
        .input-group { display:flex; flex-direction:column; gap:10px; }
        .text-input {
          background:white; border:1.5px solid rgba(139,92,246,0.2); border-radius:14px;
          padding:14px 16px; font-size:14px; font-family:'Nunito',sans-serif; font-weight:500;
          color:#1a0a2e; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%;
        }
        .text-input::placeholder { color:#a0aec0; }
        .text-input:focus { border-color:#7c3aed; box-shadow:0 0 0 3px rgba(124,58,237,0.1); }

        .cta-btn {
          background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%); color:white; border:none;
          border-radius:50px; padding:18px 24px; font-family:'Montserrat',sans-serif; font-weight:800;
          font-size:16px; letter-spacing:0.02em; cursor:pointer; width:100%;
          box-shadow:0 8px 24px rgba(91,33,182,0.45),0 2px 8px rgba(0,0,0,0.15);
          transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s; position:relative; overflow:hidden;
        }
        .cta-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%); pointer-events:none; }
        .cta-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 28px rgba(91,33,182,0.5); }
        .cta-btn:active:not(:disabled) { transform:translateY(1px); }
        .cta-btn:disabled { opacity:0.45; cursor:not-allowed; }

        /* BOOKING HERO */
        .booking-hero {
          background:linear-gradient(160deg,#3b1278 0%,#5b21b6 40%,#4c1d95 70%,#2d0a6e 100%);
          padding:32px 24px 28px; position:relative; overflow:hidden;
        }
        .booking-hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 20% 0%,rgba(255,255,255,0.07) 0%,transparent 55%); pointer-events:none; }
        .back-btn {
          display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.12);
          border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:6px 14px;
          color:rgba(255,255,255,0.85); font-size:12px; font-weight:700; cursor:pointer;
          width:fit-content; margin-bottom:18px; font-family:'Nunito',sans-serif; transition:background 0.2s;
        }
        .back-btn:hover { background:rgba(255,255,255,0.2); }
        .booking-hero h2 { font-family:'Montserrat',sans-serif; font-weight:900; font-size:22px; color:white; margin-bottom:4px; position:relative; }
        .booking-hero > p { font-size:13px; color:rgba(255,255,255,0.65); font-weight:500; position:relative; }
        .name-tag { display:inline-block; background:rgba(255,255,255,0.15); border-radius:20px; padding:4px 12px; font-size:12px; font-weight:700; color:rgba(255,255,255,0.9); margin-top:10px; position:relative; }

        .booking-body { padding:24px 18px 32px; display:flex; flex-direction:column; gap:20px; }
        .section-label { font-family:'Montserrat',sans-serif; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:#7c3aed; margin-bottom:10px; display:block; }

        /* DAY TABS */
        .day-tabs { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
        .day-tab {
          background:white; border:2px solid rgba(139,92,246,0.15); border-radius:16px;
          padding:14px 10px; text-align:center; cursor:pointer; transition:all 0.2s;
          box-shadow:0 2px 8px rgba(91,33,182,0.06);
        }
        .day-tab:hover { border-color:#a78bfa; }
        .day-tab.selected { border-color:#7c3aed; background:linear-gradient(135deg,#f5f0ff 0%,#ede9fe 100%); box-shadow:0 4px 16px rgba(91,33,182,0.15); }
        .day-tab.fully-booked { opacity:0.45; cursor:not-allowed; background:#f5f5f8; border-color:rgba(139,92,246,0.08); pointer-events:none; }
        .day-tab.fully-booked .dt-weekday { color:#aaa; }
        .day-tab.fully-booked .dt-num { color:#aaa; }
        .fully-booked-tag { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#b0a0c8; margin-top:3px; }
        .dt-weekday { font-family:'Montserrat',sans-serif; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#7c3aed; margin-bottom:3px; }
        .dt-num { font-size:24px; font-weight:900; font-family:'Montserrat',sans-serif; color:#1a0a2e; line-height:1; margin-bottom:2px; }
        .dt-month { font-size:11px; font-weight:600; color:#6b7280; }
        .day-tab.selected .dt-num { color:#5b21b6; }

        .locked-note { background:white; border-radius:14px; padding:12px 16px; border:1px dashed rgba(139,92,246,0.2); display:flex; align-items:center; gap:10px; margin-top:10px; }
        .locked-note span { font-size:12.5px; color:#9ca3af; font-weight:600; }

        /* SLOT CARDS */
        .period-label { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
        .slots-group { display:flex; flex-direction:column; gap:10px; }
        .slot-card {
          background:white; border:2px solid rgba(139,92,246,0.12); border-radius:18px;
          padding:16px 18px; display:flex; align-items:center; gap:14px;
          cursor:pointer; transition:all 0.2s; box-shadow:0 2px 10px rgba(91,33,182,0.06);
        }
        .slot-card:hover:not(.booked) { border-color:#a78bfa; transform:translateY(-1px); }
        .slot-card.selected { border-color:#7c3aed; background:linear-gradient(135deg,#f5f0ff 0%,#ede9fe 100%); box-shadow:0 6px 20px rgba(91,33,182,0.18); }
        .slot-card.booked { opacity:0.42; cursor:not-allowed; pointer-events:none; background:#f5f5f8; border-color:rgba(139,92,246,0.06); }
        .slot-icon { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#f0ebff,#e5d9ff); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .slot-card.selected .slot-icon { background:linear-gradient(135deg,#7c3aed,#5b21b6); }
        .slot-card.booked .slot-icon { background:#ebebf0; filter:grayscale(1); }
        .slot-info { flex:1; }
        .slot-name { font-family:'Montserrat',sans-serif; font-weight:800; font-size:13px; color:#1a0a2e; margin-bottom:2px; }
        .slot-time { font-size:14px; font-weight:700; color:#5b21b6; }
        .slot-card.booked .slot-time { color:#aaa; }
        .booked-badge { font-size:10px; font-weight:800; background:#f0ebff; color:#9c6fe4; border-radius:8px; padding:2px 8px; letter-spacing:0.04em; text-transform:uppercase; }
        .slot-check { width:22px; height:22px; border-radius:50%; border:2px solid #c4b5fd; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .slot-card.selected .slot-check { background:#7c3aed; border-color:#7c3aed; }
        .slot-card.booked .slot-check { border-color:#ddd; background:#f0f0f0; }

        /* LOADING SHIMMER */
        .shimmer { border-radius:18px; height:76px; background:linear-gradient(90deg,#ede9fe 25%,#f5f3ff 50%,#ede9fe 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ERROR */
        .error-box { background:#fff0f0; border:1px solid #fca5a5; border-radius:14px; padding:12px 16px; font-size:13px; font-weight:600; color:#dc2626; }

        /* CONFIRM */
        .confirm-screen { padding:40px 20px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; }
        .confirm-icon { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#5b21b6); display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(91,33,182,0.4); font-size:30px; margin-bottom:4px; }
        .confirm-title { font-family:'Montserrat',sans-serif; font-weight:900; font-size:22px; color:#1a0a2e; }
        .confirm-sub { font-size:13.5px; color:#6b7280; font-weight:500; line-height:1.5; max-width:300px; }
        .confirm-card { background:white; border-radius:18px; padding:20px; width:100%; border:1px solid rgba(139,92,246,0.15); box-shadow:0 4px 16px rgba(91,33,182,0.08); display:flex; flex-direction:column; gap:12px; margin-top:4px; }
        .confirm-row { display:flex; align-items:center; gap:12px; }
        .confirm-row-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#f0ebff,#e5d9ff); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .confirm-row-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#9ca3af; margin-bottom:1px; }
        .confirm-row-value { font-family:'Montserrat',sans-serif; font-weight:800; font-size:13px; color:#1a0a2e; }
        .divider { height:1px; background:rgba(139,92,246,0.1); }
      `}</style>

      <div className="page-wrapper">

        {/* ══ FORM PAGE ══ */}
        {page === "form" && (
          <>
            <div className="hero">
              <div className="hero-badge">⚡ Exclusive Strategy Session</div>
              <h1>Fitness Business Strategy Discussion with Sushanth P.</h1>
              <p className="hero-sub">Your Gen 4 Blueprint awaits.</p>
            </div>
            <div className="form-body">
              {questions.map((q, i) => (
                <div className="question-card" key={q.id}>
                  <p className="question-text">
                    <span className="question-num">{i + 1}. </span>{q.text}
                  </p>
                  <div className="radio-group">
                    {["Yes", "No"].map(opt => (
                      <label
                        key={opt}
                        className={`radio-label ${answers[q.id] === opt ? "checked" : ""}`}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      >
                        <div className="radio-custom"><div className="radio-dot" /></div>
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="input-group">
                <input className="text-input" type="text" placeholder="Name ✱" value={name} onChange={e => setName(e.target.value)} />
                <input className="text-input" type="tel" placeholder="WhatsApp Number ✱" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>
              <button className="cta-btn" onClick={handleSchedule} disabled={!name.trim() || !whatsapp.trim()}>
                Schedule Now →
              </button>
            </div>
          </>
        )}

        {/* ══ BOOKING PAGE ══ */}
        {page === "booking" && !confirmed && (
          <>
            <div className="booking-hero">
              <button className="back-btn" onClick={() => setPage("form")}>← Back</button>
              <h2>Pick Your Session</h2>
              <p>Choose a day and time that works for you.</p>
              <div className="name-tag">👋 Hey, {name}!</div>
            </div>

            <div className="booking-body">

              {/* Day picker */}
              <div>
                <span className="section-label">Available Days</span>
                <div className="day-tabs">
                  {days.map((d, i) => {
                    const fullyBooked = isDayFullyBooked(i);
                    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Day After";
                    return (
                      <div
                        key={i}
                        className={`day-tab ${selectedDay === i ? "selected" : ""} ${fullyBooked ? "fully-booked" : ""}`}
                        onClick={() => { if (!fullyBooked) { setSelectedDay(i); setSelectedSlot(null); setError(""); } }}
                      >
                        <div className="dt-weekday">{label}</div>
                        <div className="dt-num">{d.getDate()}</div>
                        <div className="dt-month">{d.toLocaleDateString("en-US", { month: "short" })}</div>
                        {fullyBooked && <div className="fully-booked-tag">🔒 Full</div>}
                      </div>
                    );
                  })}
                </div>
                <div className="locked-note">
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <span>Only today, tomorrow & day after are open for booking.</span>
                </div>
              </div>

              {/* Slot picker */}
              {selectedDay !== null && (
                <div>
                  <span className="section-label">
                    Slots — {days[selectedDay].toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>

                  {loadingSlots ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="shimmer" />
                      <div className="shimmer" />
                      <div className="shimmer" />
                    </div>
                  ) : (
                    <>
                      <p className="period-label">🌅 Morning</p>
                      <div className="slots-group" style={{ marginBottom: 14 }}>
                        {SLOTS.filter(s => s.period === "morning").map(slot => {
                          const booked = isBooked(selectedDay, slot.id);
                          const selected = selectedSlot === slot.id;
                          return (
                            <div
                              key={slot.id}
                              className={`slot-card ${selected ? "selected" : ""} ${booked ? "booked" : ""}`}
                              onClick={() => !booked && setSelectedSlot(slot.id)}
                            >
                              <div className="slot-icon">{slot.icon}</div>
                              <div className="slot-info">
                                <div className="slot-name">{slot.label}</div>
                                <div className="slot-time">{slot.time}</div>
                              </div>
                              <div>
                                {booked
                                  ? <span className="booked-badge">Booked</span>
                                  : (
                                    <div className="slot-check">
                                      {selected && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </div>
                                  )
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="period-label">🌆 Evening</p>
                      <div className="slots-group">
                        {SLOTS.filter(s => s.period === "evening").map(slot => {
                          const booked = isBooked(selectedDay, slot.id);
                          const selected = selectedSlot === slot.id;
                          return (
                            <div
                              key={slot.id}
                              className={`slot-card ${selected ? "selected" : ""} ${booked ? "booked" : ""}`}
                              onClick={() => !booked && setSelectedSlot(slot.id)}
                            >
                              <div className="slot-icon">{slot.icon}</div>
                              <div className="slot-info">
                                <div className="slot-name">{slot.label}</div>
                                <div className="slot-time">{slot.time}</div>
                              </div>
                              <div>
                                {booked
                                  ? <span className="booked-badge">Booked</span>
                                  : (
                                    <div className="slot-check">
                                      {selected && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </div>
                                  )
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && <div className="error-box">{error}</div>}

              <button
                className="cta-btn"
                onClick={handleConfirm}
                disabled={selectedDay === null || !selectedSlot || submitting}
              >
                {submitting ? "Confirming…" : "Confirm Booking ✓"}
              </button>
            </div>
          </>
        )}

        {/* ══ CONFIRMED PAGE ══ */}
        {page === "booking" && confirmed && (
          <>
            <div className="booking-hero" style={{ paddingBottom: 32 }} />
            <div className="confirm-screen">
              <div className="confirm-icon">✅</div>
              <div className="confirm-title">You're Booked!</div>
              <div className="confirm-sub">
                Sushanth will reach out on WhatsApp before the session. Looking forward to seeing you!
              </div>
              <div className="confirm-card">
                <div className="confirm-row">
                  <div className="confirm-row-icon">👤</div>
                  <div>
                    <div className="confirm-row-label">Name</div>
                    <div className="confirm-row-value">{name}</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="confirm-row">
                  <div className="confirm-row-icon">📅</div>
                  <div>
                    <div className="confirm-row-label">Date</div>
                    <div className="confirm-row-value">{selectedDay !== null && formatDay(days[selectedDay])}</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="confirm-row">
                  <div className="confirm-row-icon">{chosenSlot?.icon}</div>
                  <div>
                    <div className="confirm-row-label">Time</div>
                    <div className="confirm-row-value">{chosenSlot?.time}</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="confirm-row">
                  <div className="confirm-row-icon">📱</div>
                  <div>
                    <div className="confirm-row-label">WhatsApp</div>
                    <div className="confirm-row-value">{whatsapp}</div>
                  </div>
                </div>
              </div>
              <button
                className="cta-btn"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setPage("form"); setConfirmed(false);
                  setSelectedDay(null); setSelectedSlot(null);
                  setName(""); setWhatsapp(""); setError("");
                  setAnswers({ q1: "", q2: "", q3: "" });
                }}
              >
                Book Another Session
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
}