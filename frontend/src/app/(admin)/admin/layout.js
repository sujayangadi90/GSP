'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  Cpu, 
  Bookmark, 
  MessageSquare, 
  MailWarning, 
  LogOut, 
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState('Administrator');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // We do not want sidebar or checking on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gsp_token');
      const name = localStorage.getItem('gsp_admin_name');
      if (name) {
        setAdminName(name);
      }

      if (!token && !isLoginPage) {
        router.push('/admin/login');
      } else {
        setCheckingAuth(false);
      }
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem('gsp_token');
    localStorage.removeItem('gsp_admin_name');
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center font-sans">{children}</div>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Authenticating administrator access...</p>
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Banner Images', path: '/admin/banners', icon: ImageIcon },
    { name: 'CMS Editor', path: '/admin/cms', icon: Settings },
    { name: 'Services & Cats', path: '/admin/services', icon: Cpu },
    { name: 'Brands Manager', path: '/admin/brands', icon: Bookmark },
    { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquare },
    { name: 'Lead Inquiries', path: '/admin/inquiries', icon: MailWarning },
    { name: 'Training Leads', path: '/admin/training-leads', icon: GraduationCap }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-teal-500 selection:text-white">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2.5">
            <img 
              src="/GSPlogoTransperant.png" 
              alt="Global Service Point Logo" 
              className="h-8 w-auto" 
            />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm tracking-wide text-white leading-tight">Admin Console</span>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest leading-none mt-0.5">Control Center</span>
            </div>
          </div>

          {/* Links list */}
          <nav className="p-4 flex flex-col gap-1.5 mt-4">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card & Logout bottom actions */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-850 p-3 rounded-xl mb-3 text-left">
            <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{adminName}</span>
              <span className="text-[9px] text-slate-400 font-medium">Root Admin</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main workspace panels */}
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        {/* Top Control Bar */}
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Security Active</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-450">
            <span>Server Time: {new Date().toLocaleDateString()}</span>
            <span className="bg-slate-800 text-teal-400 border border-slate-700 px-2 py-0.5 rounded">v2.0 Stable</span>
          </div>
        </header>

        {/* Workspace body */}
        <main className="flex-grow p-8 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
