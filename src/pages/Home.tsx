
import Hero from "../components/Hero"
import Crusades from "../components/CrusadesSec"
import Testimonies from "../components/Testimoniescarousel"

const Home = () => {
  return (
    <main className="bg-white text-black min-h-screen">
      <Hero />
      <Crusades />
      <Testimonies />
    </main>
  )
}

export default Home
