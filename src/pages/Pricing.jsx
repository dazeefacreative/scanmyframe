import Footer from '../components/Footer';
import Header from '../components/Header';
import Price from '../components/Price';
import { useTheme } from '../context/ThemeContext';

export default function Pricing() {
  const { isDark } = useTheme();

  return (
    <>
    <main className={`${isDark ? 'bg-[#000000] text-white' : 'bg-white text-gray-900'} min-h-screen transition-colors duration-200`}>
    <Header/>
      <section className={`${isDark ? 'bg-black' : 'bg-gray-50'} py-24 px-4 transition-colors duration-200`}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className={`max-w-3xl mx-auto text-4xl font-poltawski font-bold mb-4 ${isDark ? 'text-secondary' : 'text-gray-900'}`}>
              Start free. Upgrade when you grow.
            </h2>
            <p className={`max-w-4xl text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
           Choose a plan that fits your current stage and goals. As you grow, upgrading unlocks more capacity, deeper insights, branding, and tools to help you increase engagement and scale your usage.<br/>Each plan is designed to help you turn every QR interaction into a more valuable experience.
            </p>
            <p className={`max-w-4xl text-sm mt-6 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            You get free access to all features for 30 days on your first signup. No credit card required.
            </p>
          </div>
          <div className="scale-70">
            <Price/>
          </div>
        </div>
      </section>
    </main>
    <Footer/>
    </>
  );
}
