import React, { useState, type ChangeEvent, type FormEvent } from "react";

const Contacts: React.FC = () => {
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

  const [messageForm, setMessageForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleBookingChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessageForm({ ...messageForm, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        name: bookingForm.ministryGroup || 'Unending Praise Booking',
        email: bookingForm.email,
        phone: bookingForm.phone,
        message: `Booking Request: ${bookingForm.participatingMinistries}, ${bookingForm.ministryGroup}, ${bookingForm.numPeople} people, ${bookingForm.month} ${bookingForm.day} at ${bookingForm.praiseTime}, KingsChat: ${bookingForm.kingschat}`,
        subject: 'Unending Praise Booking Request',
      };
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      alert("Failed to submit request. Please try again.");
    }
  };

  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        name: messageForm.name,
        email: messageForm.email,
        phone: messageForm.phone,
        message: messageForm.message,
        subject: messageForm.subject || 'Contact Form Message',
      };
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        });
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      alert("Failed to send message. Please try again.");
    }
  };

  const participatingMinistries = ["ISM", "REON", "Individual Group", "Others"];
  const months = [
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const praiseTimes = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"];

  const inputClass =
    "w-full p-3 border border-gray-300 rounded-lg bg-[#FFF] text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 pt-24"> 
      {/* ✅ Added pt-24 to fix being covered by navbar */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10">Contact Us</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT FORM */}
          <div className="bg-[#F5F1DD] px-8 pt-8 pb-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
              Pastor Chris Live Unending Praise Worship Time Slot Selection
            </h2>

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
                <option value="">Select Praise Time (GMT+1)</option>
                {praiseTimes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full bg-[#723180] text-white py-3 rounded-lg font-semibold hover:bg-[#5b2666] transition flex justify-center items-center gap-2"
              >
                SUBMIT <span>→</span>
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div className="bg-[#F5F1DD] p-8 rounded-lg shadow-md">
              <h3 className="text-sm text-gray-600 mb-1">For More Inquiries...</h3>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
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

            <div className="bg-[#F5F1DD] p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">QUICK CONTACT</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    KINGSCHAT USERNAME
                  </h3>
                  <p className="text-gray-900 font-medium">@Title</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
