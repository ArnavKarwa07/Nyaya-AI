"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', filled: true },
    { href: '/chat', label: 'Intelligence', icon: 'psychology', filled: false },
    { href: '/conflicts', label: 'Conflicts', icon: 'warning', filled: false },
    { href: '/amendments', label: 'Amendments', icon: 'gavel', filled: false },
  ];

  return (
    <aside className="global-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <span className="material-symbols-outlined icon-on-brand" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
          </div>
          <div>
            <h1 className="brand-title">NyayaLens</h1>
            <p className="brand-subtitle">The Digital Jurist</p>
          </div>
        </div>
        
        <button className="btn-new-case">
          <span className="material-symbols-outlined icon-small">add</span>
          New Research
        </button>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span 
                className="material-symbols-outlined" 
                style={item.filled || pathname === item.href ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="sidebar-bottom">
        <nav className="sidebar-nav-bottom">
          <Link href="#" className="nav-item-bottom">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
          <Link href="#" className="nav-item-bottom">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Help</span>
          </Link>
        </nav>
      </div>
    </aside>
  )
}
