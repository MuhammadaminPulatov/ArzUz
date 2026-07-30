export interface MockOrganization {
  id: string
  name: string
  shortName: string
  icon: string
  category: string
  district: string
  phone: string
  totalAssigned: number
  resolved: number
  inProgress: number
}

export const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { id: 'org-1', name: "Toshkent kommunal xizmatlari", shortName: 'Kommunal', icon: '🏛', category: "Suv muammosi", district: 'Barcha tumanlar', phone: '+998 71 123-45-67', totalAssigned: 48, resolved: 31, inProgress: 12 },
  { id: 'org-2', name: "Yo'l qurilish boshqarmasi", shortName: "Yo'l", icon: '🛣', category: "Yo'l nosozligi", district: 'Barcha tumanlar', phone: '+998 71 234-56-78', totalAssigned: 36, resolved: 22, inProgress: 8 },
  { id: 'org-3', name: "Chiqindilarni boshqarish xizmati", shortName: 'Chiqindi', icon: '♻️', category: "Axlat muammosi", district: 'Barcha tumanlar', phone: '+998 71 345-67-89', totalAssigned: 29, resolved: 18, inProgress: 7 },
  { id: 'org-4', name: "Ko'kalamzorlashtirish boshqarmasi", shortName: "Ko'kat", icon: '🌳', category: "Ko'kalamzorlashtirish", district: 'Barcha tumanlar', phone: '+998 71 456-78-90', totalAssigned: 21, resolved: 15, inProgress: 4 },
  { id: 'org-5', name: "Gaz ta'minoti xizmati", shortName: 'Gaz', icon: '🔥', category: "Gaz muammosi", district: 'Barcha tumanlar', phone: '+998 71 567-89-01', totalAssigned: 18, resolved: 14, inProgress: 3 },
  { id: 'org-6', name: "Elektr ta'minoti xizmati", shortName: 'Elektr', icon: '⚡', category: "Elektr muammosi", district: 'Barcha tumanlar', phone: '+998 71 678-90-12', totalAssigned: 24, resolved: 16, inProgress: 6 },
  { id: 'org-7', name: "Chilonzor tuman hokimligi", shortName: 'Chilonzor', icon: '🏢', category: 'Umumiy', district: 'Chilonzor tumani', phone: '+998 71 111-11-11', totalAssigned: 15, resolved: 10, inProgress: 3 },
  { id: 'org-8', name: "Yunusobod tuman hokimligi", shortName: 'Yunusobod', icon: '🏢', category: 'Umumiy', district: 'Yunusobod tumani', phone: '+998 71 222-22-22', totalAssigned: 12, resolved: 8, inProgress: 3 },
  { id: 'org-9', name: "Yakkasaroy tuman hokimligi", shortName: 'Yakkasaroy', icon: '🏢', category: 'Umumiy', district: 'Yakkasaroy tumani', phone: '+998 71 333-33-33', totalAssigned: 9, resolved: 6, inProgress: 2 },
  { id: 'org-10', name: "Mahalla qo'mitalar kengashi", shortName: 'Mahalla', icon: '🤝', category: 'Mahalla', district: 'Barcha tumanlar', phone: '+998 71 444-44-44', totalAssigned: 33, resolved: 20, inProgress: 9 },
]
