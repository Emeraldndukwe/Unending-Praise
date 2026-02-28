import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { X } from "lucide-react";
import TestimonyForm from "../components/TestimonyForm";
import TestFormContent from "../components/TestFormContent";

// ─── Modal Wrapper ─────────────────────────────────────────────────────────────
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-4">
      <div className="relative bg-[#F5F1DD] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Sticky close button row */}
        <div className="flex justify-end p-3 pb-0 shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto modal-scroll px-6 sm:px-8 pb-8 pt-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a3a4a] text-center mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-center text-sm sm:text-base mb-6">{subtitle}</p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const Contacts: React.FC = () => {
  // Modal visibility
  const [testimonyModalOpen, setTestimonyModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // ── Send-us-a-message form ────────────────────────────────────────────────
  const [messageForm, setMessageForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
    kingschat: "",
  });

  const handleMessageChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setMessageForm({ ...messageForm, [e.target.name]: e.target.value });
  };

  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        name: messageForm.name,
        email: messageForm.email,
        phone: messageForm.phone,
        message:
          (messageForm.kingschat
            ? `KingsChat Username: ${messageForm.kingschat}\n\n`
            : "") + messageForm.message,
        subject: messageForm.subject || "Contact Form Message",
      };
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Your message has been sent!");
        setMessageForm({
          name: "",
          phone: "",
          email: "",
          subject: "",
          message: "",
          kingschat: "",
        });
      } else {
        throw new Error("Submission failed");
      }
    } catch {
      alert("Failed to send message. Please try again.");
    }
  };

  // ── Booking form (worship time slot – inline, no separate component) ─────
  const [bookingForm, setBookingForm] = useState({
    participatingMinistries: "",
    ministryGroup: "",
    phone: "",
    email: "",
    kingschat: "",
    numPeople: "",
    month: "",
    day: "",
    praiseTime: "",
  });

  const handleBookingChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        name: bookingForm.ministryGroup || "Unending Praise Booking",
        email: bookingForm.email,
        phone: bookingForm.phone,
        message: `Booking Request: ${bookingForm.participatingMinistries}, ${bookingForm.ministryGroup}, ${bookingForm.numPeople} people, ${bookingForm.month} ${bookingForm.day} at ${bookingForm.praiseTime}, KingsChat: ${bookingForm.kingschat}`,
        subject: "Unending Praise Booking Request",
      };
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Your booking request has been submitted!");
        setBookingForm({
          participatingMinistries: "",
          ministryGroup: "",
          phone: "",
          email: "",
          kingschat: "",
          numPeople: "",
          month: "",
          day: "",
          praiseTime: "",
        });
        setBookingModalOpen(false);
      } else {
        throw new Error("Submission failed");
      }
    } catch {
      alert("Failed to submit request. Please try again.");
    }
  };

  const participatingMinistries = [
    "ISM",
    "REON",
    "Individual Group",
    "Others",
  ];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const praiseTimes = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? 0 : 30;
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minuteLabel = minute === 0 ? "00" : "30";
    return `${hour12}:${minuteLabel} ${period}`;
  });

  const inputClass =
    "w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500";

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-2xl mx-auto">
        {/* ── PAGE TITLE ──────────────────────────────────────────────── */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Contact Us
        </h1>

        {/* ── SEND US A MESSAGE FORM ──────────────────────────────────── */}
        <div className="bg-[#F5F1DD] p-8 rounded-lg shadow-md mb-12">
          <h3 className="text-sm text-gray-600 mb-1 text-center">
            For More Inquiries...
          </h3>
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            SEND US A MESSAGE
          </h2>

          <form onSubmit={handleMessageSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={messageForm.name}
              onChange={handleMessageChange}
              className={inputClass}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={messageForm.phone}
              onChange={handleMessageChange}
              className={inputClass}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={messageForm.email}
              onChange={handleMessageChange}
              className={inputClass}
              required
            />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={messageForm.subject}
              onChange={handleMessageChange}
              className={inputClass}
              required
            />
            <div>
              <p className="text-xs text-gray-500 mb-1">
                If you are submitting on behalf of your group, kindly input your
                kingschat username
              </p>
              <input
                type="text"
                name="kingschat"
                placeholder="KingsChat Username"
                value={messageForm.kingschat}
                onChange={handleMessageChange}
                className={inputClass}
              />
            </div>
            <textarea
              name="message"
              placeholder="Message"
              rows={4}
              className={`${inputClass} resize-none`}
              value={messageForm.message}
              onChange={handleMessageChange}
              required
            />
            <button
              type="submit"
              className="w-full bg-[#723180] text-white py-3 rounded-lg font-semibold hover:bg-[#5b2666] transition flex justify-center items-center gap-2"
            >
              SUBMIT <span>→</span>
            </button>
          </form>
        </div>

        {/* ── QUESTION LINKS ─────────────────────────────────────────── */}
        <div className="space-y-5 text-center mb-12">
          <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
            Want to share your testimony?{" "}
            <button
              onClick={() => setTestimonyModalOpen(true)}
              className="text-[#1a3a4a] hover:underline font-normal"
            >
              Click Here
            </button>
          </p>

          <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
            Want to submit your Pastor Chris Live Unending Praise crusade report?{" "}
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-[#1a3a4a] hover:underline font-normal"
            >
              Click Here
            </button>
          </p>

          <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
            Request for a worship slot?{" "}
            <button
              onClick={() => setBookingModalOpen(true)}
              className="text-[#1a3a4a] hover:underline font-normal"
            >
              Submit a Request
            </button>
          </p>

          <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
            Quick Contact?{" "}
            <a
              href="https://kingschat.online/user/uepcommunications"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a3a4a] hover:underline font-normal"
            >
              Click Here
            </a>
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TESTIMONY MODAL — reuses the TestimonyForm component              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        open={testimonyModalOpen}
        onClose={() => setTestimonyModalOpen(false)}
        title="Share Your Testimony"
        subtitle="We'd love to hear what God has done for you."
      >
        <TestimonyForm
          embedded
          onSuccess={() => setTestimonyModalOpen(false)}
        />
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CRUSADE REPORT MODAL — reuses the TestFormContent component       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Crusade Report Form"
        subtitle="Submit your Pastor Chris Live Unending Praise Crusade report."
      >
        <TestFormContent
          embedded
          onSuccess={() => setReportModalOpen(false)}
        />
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOOKING MODAL — worship time slot (same form as before)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Book a Praise Time Slot"
        subtitle="Pastor Chris Live — Unending Praise Worship Time Slot Selection"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <select
            name="participatingMinistries"
            value={bookingForm.participatingMinistries}
            onChange={handleBookingChange}
            className={inputClass}
            required
          >
            <option value="">Participating Ministries</option>
            {participatingMinistries.map((ministry) => (
              <option key={ministry} value={ministry}>
                {ministry}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="ministryGroup"
            placeholder="Church/Ministry/Group Name"
            value={bookingForm.ministryGroup}
            onChange={handleBookingChange}
            className={inputClass}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={bookingForm.phone}
              onChange={handleBookingChange}
              className={inputClass}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={bookingForm.email}
              onChange={handleBookingChange}
              className={inputClass}
              required
            />
          </div>

          <input
            type="text"
            name="kingschat"
            placeholder="Kingschat Username"
            value={bookingForm.kingschat}
            onChange={handleBookingChange}
            className={inputClass}
            required
          />

          <input
            type="number"
            name="numPeople"
            placeholder="Number of People (Min. 18)"
            value={bookingForm.numPeople}
            onChange={handleBookingChange}
            min={18}
            className={inputClass}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              name="month"
              value={bookingForm.month}
              onChange={handleBookingChange}
              className={inputClass}
              required
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              name="day"
              value={bookingForm.day}
              onChange={handleBookingChange}
              className={inputClass}
              required
            >
              <option value="">Select Day</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              name="praiseTime"
              value={bookingForm.praiseTime}
              onChange={handleBookingChange}
              className={inputClass}
              required
            >
              <option value="">Praise Time (GMT+1)</option>
              {praiseTimes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-[#723180] text-white py-3 rounded-lg font-semibold hover:bg-[#5b2666] transition flex justify-center items-center gap-2 mt-2"
          >
            SUBMIT <span>→</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Contacts;
