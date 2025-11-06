import { useState } from "react";
import { motion } from "framer-motion";

export default function CrusadeForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        message: `Crusade request from ${formData.name}. Phone: ${formData.phone || 'N/A'}`,
        subject: 'Crusade Request',
      };
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit request');
      alert('Your crusade request has been submitted!');
      setFormData({ name: "", phone: "", email: "" });
    } catch (err) {
      alert('Could not submit request. Please try again later.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8f4ea] rounded-lg p-6 shadow-md"
    >
      <h3 className="font-bold text-xl mb-4 text-center">ORGANIZE A CRUSADE</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className=" bg-[#54037C]/70 text-white font-semibold py-2 rounded hover:bg-[#8e5858] transition"
        >
          SUBMIT &rarr;
        </motion.button>
      </form>
    </motion.div>
  );
}