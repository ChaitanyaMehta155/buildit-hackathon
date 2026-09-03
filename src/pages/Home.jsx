import Hero from '../components/Hero'
import Countdown from '../components/Countdown'
import Stats from '../components/Stats'
import About from '../components/About'
import Tracks from '../components/Tracks'
import HowItWorks from '../components/HowItWorks'
import Timeline from '../components/Timeline'
import Prizes from '../components/Prizes'
import Sponsors from '../components/Sponsors'
import FAQ from '../components/FAQ'
import FinalCTA from '../components/FinalCTA'

// Home renders all landing page sections in order.
function Home() {
  return (
    <>
      <Hero />
      <Countdown />
      <Stats />
      <About />
      <Tracks />
      <HowItWorks />
      <Timeline />
      <Prizes />
      <Sponsors />
      <FAQ />
      <FinalCTA />
    </>
  )
}

export default Home
