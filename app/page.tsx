import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

// Ini adalah halaman utama (Landing Page) Cahaya Tasbih
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Menampilkan Navigasi */}
      <Navbar />
      
      {/* Menampilkan Bagian Utama / Sambutan */}
      <Hero />

      {/* Bagian untuk Unit Pendidikan atau Berita bisa ditambah di sini nanti */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-emerald-800">
          Unit Pendidikan & Pondok Pesantren
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Komponen Unit akan muncul di sini secara otomatis dari database */}
          <p className="text-center col-span-full text-gray-500">
            Selamat Datang di Portal Resmi Cahaya Tasbih.
          </p>
        </div>
      </section>
    </main>
  );
}
