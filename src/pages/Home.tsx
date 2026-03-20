
import Hero from "../components/Hero"
import Crusades from "../components/CrusadesSec"
import Testimonies from "../components/Testimoniescarousel"

const AVATAR_URL = "https://lmmsdp.org/avatar/";

const Home = () => {
  return (
    <main className="bg-white text-black min-h-screen">
      <Hero />

      {/* 3-Year Anniversary Banner */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <a
          href={AVATAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block max-w-7xl mx-auto rounded-2xl overflow-hidden group"
        >
          <img
            src="/UEP_3_YEAR_Expanded_Banner.png"
            alt="Celebrating 3 Years of Unending Praise"
            className="w-full h-auto object-cover"
          />
          <div className="hidden sm:flex absolute inset-0 items-end justify-center pb-7">
            <span className="px-8 py-3 rounded-full bg-amber-300/90 hover:bg-amber-300 text-[#54037C] font-semibold text-base transition backdrop-blur-sm animate-pulse-zoom">
              Create your avatar today
            </span>
          </div>
          <div className="flex sm:hidden justify-center -mt-5 relative z-10">
            <span className="px-6 py-2.5 rounded-full bg-amber-300/90 hover:bg-amber-300 text-[#54037C] font-semibold text-sm transition shadow-lg animate-pulse-zoom">
              Create your avatar today
            </span>
          </div>
        </a>
      </section>

      <Crusades />
      <Testimonies />
    </main>
  )
}

export default Home
