import { Link } from "react-router-dom";
import { CalendarDays, Users, Images, Globe } from "lucide-react";

interface CrusadeListCardProps {
  id: string | number;
  title: string;
  description: string;
  date: string;
  mediaCount: string;
  attendance?: number;
  zone?: string;
  image: string;
}

export default function CrusadeListCard({
  id,
  title,
  description,
  date,
  mediaCount,
  attendance,
  zone,
  image,
}: CrusadeListCardProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 border-b border-gray-300 pb-6 mb-8">
      <div className="w-full md:w-1/3 bg-gray-200 h-48 flex items-center justify-center overflow-hidden rounded-lg">
        <img src={image} alt={title} className="object-cover w-full h-full" />
      </div>

      <div className="flex-1">
        <h2 className="font-bold text-lg md:text-xl mb-2">{title}</h2>
        <p className="text-gray-600 mb-3 text-sm md:text-base line-clamp-3">{description}</p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 gap-2 text-xs md:text-sm text-purple-700 font-medium mb-2">
          <div className="flex items-center gap-1">
            <CalendarDays size={14} className="md:w-4 md:h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Images size={14} className="md:w-4 md:h-4" />
            <span>{mediaCount}</span>
          </div>
          {attendance && (
            <div className="flex items-center gap-1">
              <Users size={14} className="md:w-4 md:h-4" />
              <span>{attendance.toLocaleString()} attendees</span>
            </div>
          )}
          {zone && (
            <div className="flex items-center gap-1">
              <Globe size={14} className="md:w-4 md:h-4" />
              <span>Zone: {zone}</span>
            </div>
          )}
        </div>

        <Link
          to={`/crusades/details/${id}`}
          className="text-purple-700 font-semibold hover:underline text-xs md:text-sm inline-block"
        >
          READ MORE &raquo;
        </Link>
      </div>
    </div>
  );
}