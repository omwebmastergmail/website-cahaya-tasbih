import React, { useState } from 'react';
import { SchemaViewer } from './components/SchemaViewer';
import { Database, FileCode, CheckCircle2, Copy, Shield, Layout, Settings, BookOpen, Layers, Terminal, Server, PanelTop, LayoutDashboard, Key, ScrollText } from 'lucide-react';

const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ------------------------------------------
// USER & RBAC
// ------------------------------------------

enum Role {
  SUPERADMIN
  EDITOR
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(EDITOR)
  
  // Relations
  news      News[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ------------------------------------------
// UNIT PENDIDIKAN (Education Units)
// ------------------------------------------

model UnitPendidikan {
  id        String   @id @default(cuid())
  nama      String   // e.g., "Pondok Pesantren", "SMP", "MA"
  slug      String   @unique
  deskripsi String?  @db.Text
  visi      String?  @db.Text
  misi      String?  @db.Text
  
  // Relations
  programs  ProgramUnggulan[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ProgramUnggulan {
  id               String         @id @default(cuid())
  nama             String
  deskripsi        String?        @db.Text
  
  // Relations
  unitPendidikanId String
  unitPendidikan   UnitPendidikan @relation(fields: [unitPendidikanId], references: [id], onDelete: Cascade)
  
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

// ------------------------------------------
// CONTENT (CMS)
// ------------------------------------------

model News {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  content   String   @db.Text // Can be HTML or Markdown
  excerpt   String?  // Short summary
  image     String?  // URL to featured image
  published Boolean  @default(false)
  
  // Relations
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Gallery {
  id          String   @id @default(cuid())
  title       String?
  description String?
  url         String   // Image URL
  category    String?  // Optional grouping
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ------------------------------------------
// NAVIGATION
// ------------------------------------------

model NavMenu {
  id        String   @id @default(cuid())
  label     String
  url       String
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  
  // Self-relation for Dropdown Menus
  parentId  String?
  parent    NavMenu?  @relation("NavHierarchy", fields: [parentId], references: [id])
  children  NavMenu[] @relation("NavHierarchy")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ------------------------------------------
// PAGE BUILDER
// ------------------------------------------

model LandingSection {
  id        String   @id @default(cuid())
  name      String   @unique // e.g., 'hero', 'about', 'facilities'
  content   Json     // Flexible JSON structure for dynamic layouts
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ------------------------------------------
// GLOBAL SETTINGS
// ------------------------------------------

model SiteSettings {
  id          String   @id @default(cuid())
  siteName    String   @default("Cahaya Tasbih")
  logoUrl     String?
  faviconUrl  String?
  
  // Contact Info
  alamat      String?  @db.Text
  kontak      String?  // Phone number
  email       String?
  
  // Footer & Socials
  footerText  String?
  socialMedia Json?    // { facebook: "", instagram: "", youtube: "" }
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`;

const seedContent = `import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Create Superadmin User
  // NOTE: In a real app, hash this password with bcrypt!
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cahayatasbih.com' },
    update: {},
    create: {
      email: 'admin@cahayatasbih.com',
      name: 'Super Admin',
      password: 'securepassword123', 
      role: Role.SUPERADMIN,
    },
  })
  console.log({ superAdmin })

  // 2. Create Unit Pendidikan (Education Units)
  const unitsData = [
    {
      nama: 'Pondok Pesantren',
      slug: 'pondok-pesantren',
      deskripsi: 'Pendidikan diniyah berbasis kitab kuning dan tahfidz.',
      visi: 'Mencetak santri yang berakhlakul karimah dan alim fiddin.',
      misi: 'Menyelenggarakan pendidikan salafiyah yang relevan dengan zaman.',
    },
    {
      nama: 'SMP Cahaya Tasbih',
      slug: 'smp-cahaya-tasbih',
      deskripsi: 'Sekolah Menengah Pertama berbasis boarding school.',
      visi: 'Unggul dalam prestasi akademik dan non-akademik.',
      misi: 'Mengintegrasikan kurikulum nasional dengan nilai-nilai islami.',
    },
    {
      nama: 'MA Cahaya Tasbih',
      slug: 'ma-cahaya-tasbih',
      deskripsi: 'Madrasah Aliyah dengan fokus IPA dan Keagamaan.',
      visi: 'Mewujudkan lulusan yang kompetitif, cerdas, dan religius.',
      misi: 'Mengembangkan potensi siswa melalui riset dan dakwah.',
    },
  ]

  for (const unit of unitsData) {
    await prisma.unitPendidikan.upsert({
      where: { slug: unit.slug },
      update: {},
      create: unit,
    })
  }

  // 3. Navigation Menu
  // Clean up existing first to avoid duplication logic complexity here
  await prisma.navMenu.deleteMany()

  const home = await prisma.navMenu.create({
    data: { label: 'Home', url: '/', order: 1 }
  })

  const profil = await prisma.navMenu.create({
    data: { label: 'Profil', url: '/profil', order: 2 }
  })

  // Dropdown Parent
  const unitParent = await prisma.navMenu.create({
    data: { label: 'Unit Pendidikan', url: '#', order: 3 }
  })

  // Dropdown Children
  await prisma.navMenu.createMany({
    data: [
      { label: 'Pondok Pesantren', url: '/unit/pondok-pesantren', parentId: unitParent.id, order: 1 },
      { label: 'SMP', url: '/unit/smp-cahaya-tasbih', parentId: unitParent.id, order: 2 },
      { label: 'MA', url: '/unit/ma-cahaya-tasbih', parentId: unitParent.id, order: 3 },
    ],
  })

  const berita = await prisma.navMenu.create({
    data: { label: 'Berita', url: '/berita', order: 4 }
  })

  // 4. Site Settings (Singleton)
  const settings = await prisma.siteSettings.findFirst()
  if (!settings) {
    await prisma.siteSettings.create({
      data: {
        siteName: 'Cahaya Tasbih',
        logoUrl: 'https://via.placeholder.com/150',
        alamat: 'Jl. Raya Pendidikan No. 99, Kota Santri',
        kontak: '+62 812-3456-7890',
        email: 'info@cahayatasbih.com',
        footerText: '© 2024 Pondok Pesantren Cahaya Tasbih.',
        socialMedia: {
          facebook: 'https://fb.com',
          instagram: 'https://instagram.com',
          youtube: 'https://youtube.com'
        },
      },
    })
  }

  // 5. Landing Page - Hero Section
  await prisma.landingSection.upsert({
    where: { name: 'hero' },
    update: {},
    create: {
      name: 'hero',
      content: {
        title: 'Membentuk Generasi Qurani',
        subtitle: 'Membangun karakter islami yang kuat, cerdas, dan berwawasan global.',
        bannerUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?fit=crop&w=1920&q=80',
        ctaText: 'Daftar Sekarang',
        ctaUrl: '/psb'
      },
      order: 1,
    },
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })`;

const actionsContent = `'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
// NOTE: Assume you have an auth function set up (e.g., NextAuth.js or custom)
// import { auth } from '@/auth' 

const prisma = new PrismaClient()

/**
 * 1. NAVIGATION ACTION
 * Fetches the navigation menu structure for the frontend.
 * Only returns items where isActive is true.
 */
export async function getNavigationMenu() {
  try {
    const menu = await prisma.navMenu.findMany({
      where: {
        isActive: true,
        parentId: null, // Get top-level items first
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        // Include children (sub-menus) in the response
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    })
    
    return { success: true, data: menu }
  } catch (error) {
    console.error('Failed to fetch navigation:', error)
    return { success: false, error: 'Could not load navigation' }
  }
}

/**
 * 2. PAGE BUILDER ACTION
 * Updates the 'Hero' section in the LandingSection table.
 * Restricted to SUPERADMIN.
 */
interface HeroSectionInput {
  title: string
  subtitle: string
  bannerUrl: string
}

export async function updateHeroSection(input: HeroSectionInput) {
  // --- SECURITY CHECK START ---
  // const session = await auth()
  // if (!session || session.user.role !== 'SUPERADMIN') {
  //   throw new Error("Unauthorized: You must be a SUPERADMIN to edit this section.")
  // }
  // --- SECURITY CHECK END ---

  try {
    const updatedSection = await prisma.landingSection.upsert({
      where: { name: 'hero' },
      update: {
        content: {
          title: input.title,
          subtitle: input.subtitle,
          bannerUrl: input.bannerUrl
        },
        updatedAt: new Date()
      },
      create: {
        name: 'hero',
        content: {
          title: input.title,
          subtitle: input.subtitle,
          bannerUrl: input.bannerUrl
        },
        order: 1,
        isActive: true
      }
    })

    // Purge cache for the homepage so the new hero is visible immediately
    revalidatePath('/')
    
    return { success: true, data: updatedSection }
  } catch (error) {
    console.error('Failed to update hero section:', error)
    return { success: false, error: 'Database error occurred' }
  }
}

/**
 * 3. SITE SETTINGS ACTION
 * Retrieves global configuration like Logo, Address, Contact.
 * Typically used in the Root Layout.
 */
export async function getSiteSettings() {
  try {
    const settings = await prisma.siteSettings.findFirst()
    return settings
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    return null
  }
}`;

const uiContent = `// --------------------------------------------------------------------
// FILE: components/Navbar.tsx
// --------------------------------------------------------------------
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function Navbar() {
  // Fetch active menu items, ordered by 'order'
  const navItems = await prisma.navMenu.findMany({
    where: {
      isActive: true,
      parentId: null, // Only fetch top-level parents
    },
    orderBy: {
      order: 'asc',
    },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-xl text-brand-700">
              CAHAYA TASBIH
            </Link>
          </div>
          
          <div className="hidden sm:flex sm:space-x-8 items-center">
            {navItems.map((item) => (
              <div key={item.id} className="relative group">
                {item.children.length > 0 ? (
                  // Dropdown Trigger
                  <div className="cursor-pointer inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                    {item.label}
                    <span className="ml-1 text-xs">▼</span>
                    
                    {/* Dropdown Content */}
                    <div className="absolute left-0 top-full w-48 bg-white border border-gray-100 shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.url}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Simple Link
                  <Link
                    href={item.url}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-brand-600"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

// --------------------------------------------------------------------
// FILE: components/Hero.tsx
// --------------------------------------------------------------------
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define the shape of our JSON content for safety
interface HeroContent {
  title: string
  subtitle: string
  bannerUrl: string
  ctaText?: string
  ctaUrl?: string
}

export default async function Hero() {
  const section = await prisma.landingSection.findUnique({
    where: { name: 'hero' },
  })

  // If inactive or missing, return null or default
  if (!section || !section.isActive) return null

  // Cast JSON type to our interface
  const content = section.content as unknown as HeroContent

  return (
    <div className="relative bg-gray-900 h-[600px] flex items-center">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={content.bannerUrl}
          alt="Hero Banner"
          className="w-full h-full object-cover opacity-50"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
          {content.title}
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          {content.subtitle}
        </p>
        
        {content.ctaText && (
          <div className="mt-10 flex justify-center gap-4">
            <a
              href={content.ctaUrl || '#'}
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-brand-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              {content.ctaText}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------
// FILE: app/unit/[slug]/page.tsx
// --------------------------------------------------------------------
import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const prisma = new PrismaClient()

interface UnitPageProps {
  params: {
    slug: string
  }
}

// DYNAMIC METADATA GENERATION
export async function generateMetadata(
  { params }: UnitPageProps
): Promise<Metadata> {
  const unit = await prisma.unitPendidikan.findUnique({
    where: { slug: params.slug },
  })

  if (!unit) {
    return {
      title: 'Unit Tidak Ditemukan - Cahaya Tasbih',
    }
  }

  return {
    title: \`\${unit.nama} - Cahaya Tasbih\`,
    description: unit.deskripsi || \`Profil lengkap \${unit.nama} di Pondok Pesantren Cahaya Tasbih.\`,
  }
}

export default async function UnitPage({ params }: UnitPageProps) {
  const unit = await prisma.unitPendidikan.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      programs: true, // Fetch related programs
    },
  })

  if (!unit) {
    return notFound()
  }

  return (
    <main className="bg-white min-h-screen">
      {/* Header Unit */}
      <div className="bg-brand-50 py-16 border-b border-brand-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{unit.nama}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {unit.deskripsi}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Visi Misi */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🎯 Visi
              </h2>
              <p className="text-gray-600 leading-relaxed">{unit.visi}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🚀 Misi
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {unit.misi}
              </p>
            </div>
          </div>

          {/* Program Unggulan */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Program Unggulan</h2>
            <div className="grid gap-4">
              {unit.programs.map((program) => (
                <div 
                  key={program.id} 
                  className="p-5 border border-l-4 border-l-brand-600 border-gray-200 rounded-r-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-lg text-gray-900">{program.nama}</h3>
                  {program.deskripsi && (
                    <p className="mt-2 text-sm text-gray-500">{program.deskripsi}</p>
                  )}
                </div>
              ))}

              {unit.programs.length === 0 && (
                <p className="text-gray-500 italic">Belum ada data program unggulan.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}`;

const adminContent = `// --------------------------------------------------------------------
// FILE: app/admin/layout.tsx
// --------------------------------------------------------------------
import Link from 'next/link'
import { redirect } from 'next/navigation'
// import { auth } from '@/auth' // Assume auth integration

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // --- RBAC PROTECTION ---
  // const session = await auth()
  // if (!session || session.user.role !== 'SUPERADMIN') {
  //   redirect('/') // Or show a 403 Forbidden page
  // }
  // -----------------------

  const menuItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Unit Pendidikan', href: '/admin/units' },
    { label: 'Berita & Artikel', href: '/admin/news' },
    { label: 'Navigasi Menu', href: '/admin/menu' },
    { label: 'Page Builder', href: '/admin/builder' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-900 text-white shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-1">Cahaya Tasbih CMS</p>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

// --------------------------------------------------------------------
// FILE: app/admin/builder/page.tsx
// --------------------------------------------------------------------
import { PrismaClient } from '@prisma/client'
import { updateHeroSection } from '@/app/actions' // Importing our Server Action

const prisma = new PrismaClient()

export default async function PageBuilder() {
  // Fetch current Hero configuration to pre-fill the form
  const hero = await prisma.landingSection.findUnique({
    where: { name: 'hero' }
  })
  
  const content = hero?.content as any || { title: '', subtitle: '', bannerUrl: '' }

  // Wrapper to bridge FormData with our typed Server Action
  async function handleUpdate(formData: FormData) {
    'use server'
    
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const bannerUrl = formData.get('bannerUrl') as string

    await updateHeroSection({ title, subtitle, bannerUrl })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Hero Section</h1>
      
      <form action={handleUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Main Title</label>
          <input 
            name="title" 
            defaultValue={content.title}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subtitle</label>
          <textarea 
            name="subtitle" 
            defaultValue={content.subtitle}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Banner Image URL</label>
          <input 
            name="bannerUrl" 
            defaultValue={content.bannerUrl}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
            required
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

// --------------------------------------------------------------------
// FILE: app/admin/news/page.tsx
// --------------------------------------------------------------------
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function NewsManagement() {
  const newsList = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700">
          + Add New Article
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {newsList.map((news) => (
              <tr key={news.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {news.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {news.author?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${
                    news.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }\`}>
                    {news.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(news.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-brand-600 hover:text-brand-900 mr-4">Edit</a>
                  <a href="#" className="text-red-600 hover:text-red-900">Delete</a>
                </td>
              </tr>
            ))}
            {newsList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No news articles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}`;

const envContent = `# --------------------------------------------------------------------
# FILE: .env
# --------------------------------------------------------------------

# 1. DATABASE CONNECTION (NeonDB)
# Format: postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-solitary-voice-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. NEXT AUTH (Authentication)
# Generate a secret using: openssl rand -base64 32
AUTH_SECRET="your-generated-secure-secret-key-here"

# The base URL of your application
AUTH_URL="http://localhost:3000" 
# In production (Vercel), AUTH_URL is usually auto-detected, but good to have.

# 3. OPTIONAL: BLOB STORAGE (If using Vercel Blob for images)
# BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
`;

const sqlContent = `-- ----------------------------------------------------------------
-- NEONDB / POSTGRESQL MANUAL SETUP SCRIPT
-- Copy and paste this into the SQL Editor in your Neon dashboard.
-- ----------------------------------------------------------------

-- 1. CLEANUP (Optional - Use with caution if you have existing data)
DROP TABLE IF EXISTS "ProgramUnggulan" CASCADE;
DROP TABLE IF EXISTS "UnitPendidikan" CASCADE;
DROP TABLE IF EXISTS "News" CASCADE;
DROP TABLE IF EXISTS "Gallery" CASCADE;
DROP TABLE IF EXISTS "NavMenu" CASCADE;
DROP TABLE IF EXISTS "LandingSection" CASCADE;
DROP TABLE IF EXISTS "SiteSettings" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "Role";

-- 2. ENUMS
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'EDITOR');

-- 3. TABLES (DDL)

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UnitPendidikan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT,
    "visi" TEXT,
    "misi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitPendidikan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgramUnggulan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "unitPendidikanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramUnggulan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "image" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NavMenu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NavMenu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'Cahaya Tasbih',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "alamat" TEXT,
    "kontak" TEXT,
    "email" TEXT,
    "footerText" TEXT,
    "socialMedia" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- 4. CONSTRAINTS & INDEXES

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UnitPendidikan_slug_key" ON "UnitPendidikan"("slug");
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");
CREATE UNIQUE INDEX "LandingSection_name_key" ON "LandingSection"("name");

ALTER TABLE "ProgramUnggulan" ADD CONSTRAINT "ProgramUnggulan_unitPendidikanId_fkey" 
    FOREIGN KEY ("unitPendidikanId") REFERENCES "UnitPendidikan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" 
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NavMenu" ADD CONSTRAINT "NavMenu_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "NavMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. SEEDING (Insert Initial Data)

-- User (Superadmin)
INSERT INTO "User" (id, name, email, password, role, "updatedAt") 
VALUES ('user_admin', 'Super Admin', 'admin@cahayatasbih.com', 'securepassword123', 'SUPERADMIN', NOW());

-- Units
INSERT INTO "UnitPendidikan" (id, nama, slug, deskripsi, visi, misi, "updatedAt") VALUES 
('unit_pondok', 'Pondok Pesantren', 'pondok-pesantren', 'Pendidikan diniyah berbasis kitab kuning dan tahfidz.', 'Mencetak santri yang berakhlakul karimah dan alim fiddin.', 'Menyelenggarakan pendidikan salafiyah yang relevan dengan zaman.', NOW()),
('unit_smp', 'SMP Cahaya Tasbih', 'smp-cahaya-tasbih', 'Sekolah Menengah Pertama berbasis boarding school.', 'Unggul dalam prestasi akademik dan non-akademik.', 'Mengintegrasikan kurikulum nasional dengan nilai-nilai islami.', NOW()),
('unit_ma', 'MA Cahaya Tasbih', 'ma-cahaya-tasbih', 'Madrasah Aliyah dengan fokus IPA dan Keagamaan.', 'Mewujudkan lulusan yang kompetitif, cerdas, dan religius.', 'Mengembangkan potensi siswa melalui riset dan dakwah.', NOW());

-- Navigation Menu
INSERT INTO "NavMenu" (id, label, url, "order", "isActive", "parentId", "updatedAt") VALUES
('nav_home', 'Home', '/', 1, true, NULL, NOW()),
('nav_profil', 'Profil', '/profil', 2, true, NULL, NOW()),
('nav_unit', 'Unit Pendidikan', '#', 3, true, NULL, NOW()),
('nav_berita', 'Berita', '/berita', 4, true, NULL, NOW());

-- Navigation Sub-menus (linked to 'nav_unit')
INSERT INTO "NavMenu" (id, label, url, "order", "isActive", "parentId", "updatedAt") VALUES
('nav_sub_pondok', 'Pondok Pesantren', '/unit/pondok-pesantren', 1, true, 'nav_unit', NOW()),
('nav_sub_smp', 'SMP', '/unit/smp-cahaya-tasbih', 2, true, 'nav_unit', NOW()),
('nav_sub_ma', 'MA', '/unit/ma-cahaya-tasbih', 3, true, 'nav_unit', NOW());

-- Landing Section (Hero)
INSERT INTO "LandingSection" (id, name, content, "order", "isActive", "updatedAt") 
VALUES (
    'ls_hero', 
    'hero', 
    '{"title": "Membentuk Generasi Qurani", "subtitle": "Membangun karakter islami yang kuat, cerdas, dan berwawasan global.", "bannerUrl": "https://images.unsplash.com/photo-1519817650390-64a93db51149?fit=crop&w=1920&q=80", "ctaText": "Daftar Sekarang", "ctaUrl": "/psb"}'::jsonb, 
    1, 
    true, 
    NOW()
);

-- Site Settings
INSERT INTO "SiteSettings" (id, "siteName", "logoUrl", alamat, kontak, email, "footerText", "socialMedia", "updatedAt")
VALUES (
    'site_settings',
    'Cahaya Tasbih',
    'https://via.placeholder.com/150',
    'Jl. Raya Pendidikan No. 99, Kota Santri',
    '+62 812-3456-7890',
    'info@cahayatasbih.com',
    '© 2024 Pondok Pesantren Cahaya Tasbih.',
    '{"facebook": "https://fb.com", "instagram": "https://instagram.com", "youtube": "https://youtube.com"}'::jsonb,
    NOW()
);
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'schema' | 'seed' | 'actions' | 'ui' | 'admin' | 'env' | 'sql'>('schema');
  const [copied, setCopied] = useState(false);

  let currentCode = schemaContent;
  if (activeTab === 'seed') currentCode = seedContent;
  if (activeTab === 'actions') currentCode = actionsContent;
  if (activeTab === 'ui') currentCode = uiContent;
  if (activeTab === 'admin') currentCode = adminContent;
  if (activeTab === 'env') currentCode = envContent;
  if (activeTab === 'sql') currentCode = sqlContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getNextSteps = () => {
    if (activeTab === 'schema') {
      return (
        <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
           <li>Copy the schema code.</li>
           <li>Paste into <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">prisma/schema.prisma</code>.</li>
           <li>Run <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">npx prisma generate</code>.</li>
        </ol>
      )
    }
    if (activeTab === 'sql') {
      return (
        <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
           <li><strong>Manual Setup (Recommended if no terminal):</strong></li>
           <li>Copy the entire SQL code block.</li>
           <li>Go to your NeonDB Dashboard &rarr; SQL Editor.</li>
           <li>Paste and Run. This creates tables and inserts data instantly.</li>
        </ol>
      )
    }
    if (activeTab === 'seed') {
      return (
        <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
           <li>(Optional) If you used the SQL tab, you can skip this.</li>
           <li>Otherwise, use this for automated seeding via CLI later.</li>
        </ol>
      )
    }
    if (activeTab === 'actions') {
      return (
        <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
          <li>Copy the code.</li>
          <li>Create file <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">app/actions.ts</code>.</li>
          <li>Import these functions in your Client Components or utilize them in Server Components.</li>
          <li>Uncomment the Auth/Security check lines once your Auth provider (e.g. NextAuth) is installed.</li>
        </ol>
      )
    }
    if (activeTab === 'ui') {
      return (
        <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
          <li>Copy the code block.</li>
          <li>Split into 3 separate files as indicated by the comments.</li>
          <li>Ensure your <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">@/lib/prisma</code> singleton is set up.</li>
          <li>Test by navigating to <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">/unit/pondok-pesantren</code>.</li>
        </ol>
      )
    }
    if (activeTab === 'admin') {
      return (
        <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
          <li>Create the <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">app/admin</code> directory structure.</li>
          <li>Paste the <strong>AdminLayout</strong> code into <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">app/admin/layout.tsx</code>.</li>
          <li>Enable <strong>Authentication</strong> middleware to protect the route (uncomment the RBAC logic).</li>
          <li>Verify that the <strong>Page Builder</strong> form successfully updates the database via Server Actions.</li>
        </ol>
      )
    }
    return (
      <ol className="list-decimal list-inside text-sm text-brand-800 space-y-2">
        <li>Create a file named <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">.env</code> in your project root.</li>
        <li>Copy the variables above.</li>
        <li>Replace <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">YOUR_PASSWORD</code> and host details with your actual NeonDB credentials.</li>
        <li>Generate a secret key for Auth and paste it.</li>
      </ol>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-2 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Cahaya Tasbih</h1>
              <p className="text-xs text-gray-500 font-medium">Backend Schema Architect</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-700/10">
              NeonDB Ready
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Prisma 5.x
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Documentation / Explanation Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-brand-600" />
                Schema Overview
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                This schema is optimized for a Next.js App Router project using NeonDB (PostgreSQL). 
                It implements RBAC for security and JSONB fields for page builder flexibility.
              </p>
              
              <div className="space-y-4">
                <FeatureItem 
                  icon={<Shield className="w-4 h-4 text-purple-500" />} 
                  title="RBAC System" 
                  desc="Role-based access with SUPERADMIN & EDITOR enums." 
                />
                <FeatureItem 
                  icon={<BookOpen className="w-4 h-4 text-blue-500" />} 
                  title="Education Units" 
                  desc="Structured models for Pondok, SMP, & MA with relational programs." 
                />
                <FeatureItem 
                  icon={<Layers className="w-4 h-4 text-orange-500" />} 
                  title="Page Builder" 
                  desc="JSON-based LandingSection for dynamic layout management." 
                />
                 <FeatureItem 
                  icon={<Settings className="w-4 h-4 text-slate-500" />} 
                  title="Global Config" 
                  desc="Singleton-pattern SiteSettings for easy frontend configuration." 
                />
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl border border-brand-100 p-6">
               <h3 className="text-sm font-semibold text-brand-900 mb-2">Next Steps</h3>
               {getNextSteps()}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'schema' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  schema.prisma
                </button>
                <button
                   onClick={() => setActiveTab('sql')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'sql' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  SQL Setup
                </button>
                <button
                   onClick={() => setActiveTab('seed')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'seed' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  seed.ts
                </button>
                <button
                   onClick={() => setActiveTab('actions')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'actions' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  actions.ts
                </button>
                <button
                   onClick={() => setActiveTab('ui')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'ui' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <PanelTop className="w-3.5 h-3.5" />
                  UI Components
                </button>
                <button
                   onClick={() => setActiveTab('admin')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'admin' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin CMS
                </button>
                 <button
                   onClick={() => setActiveTab('env')}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                    activeTab === 'env' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  Final Setup (.env)
                </button>
              </div>

              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  copied 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden rounded-xl border border-gray-800 shadow-2xl bg-[#1e1e1e]">
              <SchemaViewer 
                code={currentCode} 
                language={activeTab === 'schema' || activeTab === 'env' || activeTab === 'sql' ? 'prisma' : 'typescript'} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 leading-snug">{desc}</p>
      </div>
    </div>
  );
}