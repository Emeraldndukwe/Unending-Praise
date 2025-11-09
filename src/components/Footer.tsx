export default function Footer() {
  return (
    <footer className="bg-[#8A4EBF] text-white py-10 px-6 md:px-16 rounded-t-3xl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        {/* LEFT — LOGO */}
        <div className="flex justify-center md:justify-start">
            <img src="/logo.png" alt="Unending praise" className="object-contain w-[180px]" />
        </div>

        {/* MIDDLE — QUICK LINKS */}
        <div className="text-center md:text-left">
          <h2 className="text-lg font-semibold mb-4 tracking-wide text-white">QUICK LINKS</h2>
          <ul className="space-y-3 text-sm font-medium text-white">
            <li><a href="/" className="hover:underline">HOME</a></li>
            <li><a href="/about" className="hover:underline">ABOUT US</a></li>
            <li><a href="/crusades" className="hover:underline">CRUSADES</a></li>
            <li><a href="/testimonies" className="hover:underline">TESTIMONIES</a></li>
          </ul>
        </div>

        {/* RIGHT — CONTACT */}
        <div className="text-center md:text-left">
          <h2 className="text-lg font-semibold mb-4 tracking-wide text-white">CONNECT</h2>
          <a
            href="https://kingschat.online/user/-unendingpraise"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/15 inline-flex items-center justify-center px-4 py-2 rounded-full transition hover:bg-white/25"
            aria-label="KingsChat -unendingpraise"
          >
            <img
              src="/Kingschat.png"
              alt="KingsChat -unendingpraise"
              className="w-10 h-10 object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
