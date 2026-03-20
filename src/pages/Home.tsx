
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
          <div className="absolute inset-0 flex items-end justify-center pb-6 sm:pb-8">
            <span className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-black/50 hover:bg-black/70 text-white font-semibold text-sm sm:text-base transition backdrop-blur-sm group-hover:scale-105">
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
