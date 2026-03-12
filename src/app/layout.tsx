import './global.css'
import 'leaflet/dist/leaflet.css'

export const metadata = {
  title: 'NeighborGoods — Surplus Food Marketplace',
  description: 'Find affordable surplus food from local sellers near you. Reduce food waste, save money.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}