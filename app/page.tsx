import Navbar from './components/Navbar';
import Hero from './components/Hero';

// Iki halaman utama Cahaya Tasbih
export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      
      <section className="py-20 bg-emerald-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-emerald-900 mb-4">
            Selamat Datang di Pondok Pesantren Cahaya Tasbih
          </h2>
          <p className="text-emerald-700 text-lg">
            Membentuk Generasi Qur'ani, Berakhlak Mulia, dan Berwawasan Luas.
          </p>
        </div>
      </section>
    </div>
  );
}
