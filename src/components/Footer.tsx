import { FaInstagram, FaXTwitter, FaFacebookF } from "react-icons/fa6";


export default function Footer() {
  return (
    <footer className="bg-[#8A4EBF] text-black py-10 px-6 md:px-16 rounded-t-3xl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        {/* LEFT — LOGO */}
        <div className="flex justify-center md:justify-start">
            <img src="/logo.png" alt="Unending praise" className="object-contain w-[180px]" />
        </div>

        {/* MIDDLE — QUICK LINKS */}
        <div className="text-center md:text-left">
          <h2 className="text-lg font-semibold mb-4 tracking-wide">QUICK LINKS</h2>
          <ul className="space-y-2 text-sm font-medium">
            <li><a href="/" className="hover:underline">HOME</a></li>
            <li><a href="/crusades" className="hover:underline">CRUSADES</a></li>
            <li><a href="/testimonies" className="hover:underline">TESTIMONIES</a></li>
            <li><a href="/our-goal" className="hover:underline">OUR GOAL</a></li>
          </ul>
        </div>

        {/* RIGHT — CONTACT */}
        <div className="text-center md:text-left">
          <h2 className="text-lg font-semibold mb-4 tracking-wide">CONTACT US</h2>
          <div className="flex justify-center md:justify-start items-center gap-4 text-xl mb-3">
            <a href="#" aria-label="Instagram" className="hover:text-gray-800">
              <FaInstagram />
            </a>
            <a href="#" aria-label="X" className="hover:text-gray-800">
              <FaXTwitter />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-gray-800">
              <FaFacebookF />
            </a>
          </div>
          <a
            href="mailto:Unendingpraise@gmail.com"
            className="text-sm font-medium hover:underline"
          >
            Unendingpraise@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
