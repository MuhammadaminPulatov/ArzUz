import '../config/env'
import { connectDB } from '../config/db'
import { Organization } from '../models/organization.model'
import bcrypt from 'bcryptjs'

const ORGS = [
  { orgId: 'org-1',  name: "Toshkent kommunal xizmatlari",     shortName: 'Kommunal',  icon: '🏛',  category: "Suv muammosi",           district: 'Barcha tumanlar',   phone: '+998 71 123-45-67', username: 'kommunal',    password: 'kommunal123' },
  { orgId: 'org-2',  name: "Yo'l qurilish boshqarmasi",         shortName: "Yo'l",      icon: '🛣',  category: "Yo'l nosozligi",          district: 'Barcha tumanlar',   phone: '+998 71 234-56-78', username: 'yolqurilish', password: 'yol123' },
  { orgId: 'org-3',  name: "Chiqindilarni boshqarish xizmati",  shortName: 'Chiqindi',  icon: '♻️', category: "Axlat muammosi",          district: 'Barcha tumanlar',   phone: '+998 71 345-67-89', username: 'chiqindi',    password: 'chiqindi123' },
  { orgId: 'org-4',  name: "Ko'kalamzorlashtirish boshqarmasi", shortName: "Ko'kat",    icon: '🌳',  category: "Ko'kalamzorlashtirish",   district: 'Barcha tumanlar',   phone: '+998 71 456-78-90', username: 'kokalamzor',  password: 'kokalamzor123' },
  { orgId: 'org-5',  name: "Gaz ta'minoti xizmati",             shortName: 'Gaz',       icon: '🔥',  category: "Gaz muammosi",            district: 'Barcha tumanlar',   phone: '+998 71 567-89-01', username: 'gazta',       password: 'gaz123' },
  { orgId: 'org-6',  name: "Elektr ta'minoti xizmati",          shortName: 'Elektr',    icon: '⚡',  category: "Elektr muammosi",         district: 'Barcha tumanlar',   phone: '+998 71 678-90-12', username: 'elektr',      password: 'elektr123' },
  { orgId: 'org-7',  name: "Chilonzor tuman hokimligi",         shortName: 'Chilonzor', icon: '🏢',  category: 'Umumiy',                  district: 'Chilonzor tumani',  phone: '+998 71 111-11-11', username: 'chilonzor',   password: 'chilonzor123' },
  { orgId: 'org-8',  name: "Yunusobod tuman hokimligi",         shortName: 'Yunusobod', icon: '🏢',  category: 'Umumiy',                  district: 'Yunusobod tumani',  phone: '+998 71 222-22-22', username: 'yunusobod',   password: 'yunusobod123' },
  { orgId: 'org-9',  name: "Yakkasaroy tuman hokimligi",        shortName: 'Yakkasaroy',icon: '🏢',  category: 'Umumiy',                  district: 'Yakkasaroy tumani', phone: '+998 71 333-33-33', username: 'yakkasaroy',  password: 'yakkasaroy123' },
  { orgId: 'org-10', name: "Mahalla qo'mitalar kengashi",       shortName: 'Mahalla',   icon: '🤝',  category: 'Mahalla',                 district: 'Barcha tumanlar',   phone: '+998 71 444-44-44', username: 'mahalla',     password: 'mahalla123' },
]

async function seed() {
  await connectDB()
  for (const o of ORGS) {
    const passwordHash = await bcrypt.hash(o.password, 10)
    await Organization.findOneAndUpdate(
      { orgId: o.orgId },
      { ...o, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    console.log(`✓ ${o.name} (${o.username}/${o.password})`)
  }
  console.log('Seed complete!')
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
