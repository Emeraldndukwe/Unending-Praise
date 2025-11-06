import { useState } from "react";
import { Upload } from "lucide-react";
import { compressImage, compressVideo, formatFileSize, getFileSizeMB } from "../utils/mediaOptimizer";

export default function TestimonyForm() {
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    phone: "",
    email: "",
    testimony: "",
    attachments: [] as File[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.testimony) {
      alert("Please fill in name and testimony fields");
      return;
    }

    try {
      // Convert images and videos to base64 with compression
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];
      
      for (const file of formData.attachments) {
        try {
          if (file.type.startsWith("image/")) {
            const compressed = await compressImage(file);
            imageUrls.push(compressed);
          } else if (file.type.startsWith("video/")) {
            const compressed = await compressVideo(file);
            videoUrls.push(compressed);
          }
        } catch (err: any) {
          alert(`Error processing ${file.name}: ${err.message}`);
          throw err;
        }
      }

      const payload = {
        name: formData.name,
        title: formData.title,
        email: formData.email,
        phone: formData.phone,
        content: formData.testimony,
        images: imageUrls,
        videos: videoUrls,
        approved: false, // Needs admin approval
      };

      const res = await fetch('/api/testimonies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Your testimony has been submitted! It will be reviewed before being posted.");
    setFormData({
      title: "",
      name: "",
      phone: "",
      email: "",
      testimony: "",
      attachments: [],
    });
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      alert("Failed to submit testimony. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="bg-[#f8f4ea] rounded-lg p-6 shadow-md">
      <h3 className="font-bold text-xl mb-4 text-center">SHARE YOUR TESTIMONY</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />

        <textarea
          name="testimony"
          placeholder="Testimony"
          rows={4}
          value={formData.testimony}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        />

        {/* ✅ Aesthetic Upload Box */}
        <label className="text-sm font-semibold text-gray-700">Attachments</label>

        <label
          htmlFor="attachments"
          className="cursor-pointer border-2 border-dashed border-purple-700/40 bg-white rounded-xl p-5 flex flex-col items-center gap-2 hover:bg-purple-50 transition text-center"
        >
          <Upload className="text-purple-700 w-8 h-8" />
          <span className="text-sm text-gray-600 font-medium">
            Click to upload images or videos
          </span>
          <span className="text-xs text-gray-500">(You can select multiple files)</span>
        </label>

        <input
          id="attachments"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* ✅ Preview Area */}
        {formData.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {formData.attachments.map((file, index) => {
              const url = URL.createObjectURL(file);
              const sizeMB = getFileSizeMB(file);
              const isLarge = (file.type.startsWith("image/") && sizeMB > 1) || (file.type.startsWith("video/") && sizeMB > 5);

              return file.type.startsWith("image/") ? (
                <div key={index} className="relative">
                <img
                  src={url}
                  alt="preview"
                    className="w-20 h-20 object-cover rounded-lg border"
                />
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded">IMG</span>
                  {isLarge && <span className="absolute bottom-0 left-0 bg-yellow-500 text-white text-xs px-1 rounded">{formatFileSize(file.size)}</span>}
                </div>
              ) : (
                <div key={index} className="relative">
                <video
                  src={url}
                    className="w-20 h-20 rounded-lg border object-cover"
                  muted
                />
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded">VID</span>
                  {isLarge && <span className="absolute bottom-0 left-0 bg-yellow-500 text-white text-xs px-1 rounded">{formatFileSize(file.size)}</span>}
                </div>
              );
            })}
          </div>
        )}

        <button
          type="submit"
          className="bg-[#54037C]/95 text-white font-semibold py-2 rounded-2xl hover:bg-[#54037C]/70 transition mt-3"
        >
          SUBMIT &rarr;
        </button>
      </form>
    </div>
  );
}
