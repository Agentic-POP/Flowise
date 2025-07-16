import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Integrations from '../components/Integrations'
import Templates from '../components/Templates'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'

const Home = () => {
    return (
        <div className='min-h-screen bg-background'>
            <Header />
            <Hero />
            <Features />
            <Integrations />
            <Templates />
            <Pricing />
            <Footer />
        </div>
    )
}

export default Home
