import { Link } from "react-router-dom";
import { CalendarDays, Users, Image as ImageIcon, ArrowUpRight } from "lucide-react";

interface CrusadeCardProps {
  id: string | number;
  title: string;
  attendance?: number;
  date: string;
  image: string;
}

export default function CrusadeCard({ id, title, attendance, date, image }: CrusadeCardProps) {
  return (
    <div className="bg-[#9146A8] text-white rounded-[22px] shadow-xl w-[250px] md:w-[320px] flex flex-col transition-transform hover:scale-[1.03] duration-300">
      
      {/* Image */}
      <img
        src={image}
        alt={title}
        className="w-full h-[90px] md:h-[160px] object-cover rounded-t-[22px]"
        loading="lazy"
        decoding="async"
        width={400}
        height={300}
        sizes="(max-width: 768px) 250px, 320px"
      />
      
      {/* Content */}
      <div className="px-3 md:px-6 py-3 md:py-5 flex flex-col items-center text-center flex-1">
        
        {/* Title */}
        <h2 className="font-semibold text-[12px] md:text-[15px] uppercase tracking-wide">
          {title}
        </h2>

        {/* Description */}
        <p className="text-[11px] md:text-[13px] mt-1.5 text-gray-100 leading-relaxed w-[92%]">
          Join the unending praise 24hour stream, Streamed everyday till the coming of our Lord...
        </p>

        {/* Date & Media */}
        <div className="flex justify-center gap-4 md:gap-8 mt-4 text-[11px] md:text-[13px] text-gray-200">
          <div className="flex items-center gap-1">
            <CalendarDays size={13} className="md:w-[15px] md:h-[15px]" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <ImageIcon size={13} className="md:w-[15px] md:h-[15px]" />
            <span>15 images and videos</span>
          </div>
        </div>

        {/* Attendance */}
        {attendance && (
          <div className="flex items-center justify-center mt-2.5 text-[11px] md:text-[13px]">
            <Users size={13} className="md:w-[15px] md:h-[15px] mr-1" />
            <span>{attendance.toLocaleString()} attendees</span>
          </div>
        )}

        {/* Read More Link */}
        <Link
          to={`/crusades/details/${id}`}
          className="mt-5 mb-2 text-[11px] md:text-[13px] font-semibold inline-flex items-center gap-1 hover:opacity-80 transition"
          aria-label={`Read more about ${title}`}
        >
          Read more <ArrowUpRight size={13} className="md:w-[15px] md:h-[15px]" />
        </Link>

      </div>
    </div>
  );
}
