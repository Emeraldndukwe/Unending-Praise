import { Link } from "react-router-dom";

interface Testimony {
  id: string;
  title?: string;
  name?: string;
  summary?: string;
  content?: string;
  previewImage?: string;
  previewVideo?: string;
}

export default function TestimonyCard({ id, title, name, summary, content, previewImage, previewVideo }: Testimony) {
  const displaySummary = summary || content?.substring(0, 150) + "..." || "";
  // For video testimonies, show the thumbnail image (previewImage) instead of the video itself
  // For non-video testimonies, show previewVideo if available, otherwise previewImage
  const previewMedia = previewVideo && previewImage ? previewImage : (previewVideo || previewImage);

  return (
    <div className="flex flex-col md:flex-row gap-4 border-b border-gray-300 pb-4 mb-6">
      <div className="w-full md:w-1/3 bg-gray-200 h-48 flex items-center justify-center overflow-hidden rounded-lg relative">
        {previewMedia ? (
          previewVideo && previewImage ? (
            // Video testimony: show thumbnail image
            <img
              src={previewImage}
              alt={title || "Testimony"}
              className="object-cover object-center w-full h-full"
              loading="lazy"
              decoding="async"
            />
          ) : previewVideo ? (
            // Only video, no thumbnail
            <video
              src={previewVideo}
              className="object-cover w-full h-full"
              muted
              playsInline
            />
          ) : (
            // Only image
            <img
              src={previewImage}
              alt={title || "Testimony"}
              className="object-cover object-center w-full h-full"
              loading="lazy"
              decoding="async"
            />
          )
        ) : (
          <div className="text-gray-400 text-sm">No preview</div>
        )}
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-lg md:text-xl mb-2">{title || "Testimony"}</h2>
        <p className="text-gray-600 mb-3 text-sm md:text-base line-clamp-3">{displaySummary}</p>
        <p className="text-xs md:text-sm font-semibold mb-2 uppercase">{name || "Anonymous"}</p>
        <Link
          to={`/testimonies/${id}`}
          className="text-purple-600 font-semibold hover:underline text-xs md:text-sm inline-block"
          aria-label={`Read the full testimony from ${name || "this participant"}`}
        >
          Read the full testimony &raquo;
        </Link>
      </div>
    </div>
  );
}