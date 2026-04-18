import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { useAdmin } from '../context/AdminContext';
import { 
  Menu, X, Bell, LogOut, LayoutDashboard, 
  Users, UploadCloud, FileBadge, ShieldCheck, 
  BarChart2, Settings, HelpCircle
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from 'motion/react';

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, notifications } = useAdmin();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'Dashboard';
    if (path.includes('/admin/students')) return 'Student Management';
    if (path.includes('/admin/csv')) return 'CSV Upload';
    if (path.includes('/admin/certificates')) return 'Certificate Generator';
    if (path.includes('/admin/authorities')) return 'Authority Management';
    if (path.includes('/admin/reports')) return 'System Reports';
    if (path.includes('/admin/settings')) return 'Settings';
    if (path.includes('/admin/help')) return 'Help';
    return 'Admin Panel';
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Student Management', path: '/admin/students', icon: <Users size={20} /> },
    { name: 'CSV Upload', path: '/admin/csv', icon: <UploadCloud size={20} /> },
    { name: 'Certificate Generator', path: '/admin/certificates', icon: <FileBadge size={20} /> },
    { name: 'Authority Management', path: '/admin/authorities', icon: <ShieldCheck size={20} /> },
    { name: 'System Reports', path: '/admin/reports', icon: <BarChart2 size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
    { name: 'Help', path: '/admin/help', icon: <HelpCircle size={20} /> },
  ];

  const handleLogout = () => navigate('/');

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-[#121212] overflow-y-auto w-72 border-r-4 border-[#121212]">
      <div className="p-6 border-b-4 border-[#121212] flex items-center justify-between">
         <h2 className="font-black text-2xl uppercase tracking-tighter">NEXUS</h2>
         <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)}>
           <X className="w-6 h-6 text-[#121212]" />
         </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-4 overflow-y-auto">
        {navLinks.map((link) => {
          // Precise highlighted routing for nested paths without breaking active top level
          const isActive = location.pathname === link.path || (link.path !== '/admin/dashboard' && location.pathname.startsWith(link.path));
          
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-4 px-4 py-3 font-black uppercase text-xs tracking-widest transition-all
                ${isActive ? 'bg-[#121212] text-white shadow-[4px_4px_0px_0px_#F0C020]' : 'hover:bg-[#F0F0F0] text-[#121212]'}
              `}
            >
              <div className={isActive ? "text-[#F0C020]" : "opacity-60"}>{link.icon}</div>
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 border-t-4 border-[#121212]">
         <button onClick={handleLogout} className="flex items-center gap-4 font-black uppercase text-xs tracking-widest w-full px-4 py-3 bg-[#D02020] text-white hover:bg-black transition-colors">
            <LogOut size={20} /> Log Out
         </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex overflow-hidden font-sans text-[#121212]">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen fixed top-0 left-0 z-40">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-72 h-full shadow-[8px_0px_0px_0px_#121212]"
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 h-screen overflow-hidden relative">
        
        {/* Universal Top Nav */}
        <header className="h-20 bg-white border-b-4 border-[#121212] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 sticky top-0 shadow-[0px_4px_0px_0px_transparent]">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 bg-[#121212] text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <Logo />
                 <span className="bg-[#121212] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 self-center">Admin Panel</span>
               </div>
            </div>
          </div>

          <h1 className="font-black text-xl lg:text-3xl uppercase tracking-tighter hidden md:block absolute left-1/2 -translate-x-1/2">
            {getPageTitle()}
          </h1>

          <div className="flex items-center gap-4 lg:gap-8">
            <button className="relative p-2 text-[#121212] hover:bg-[#F0F0F0] transition-colors" title="Notifications">
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-2 w-3 h-3 bg-[#D02020] border-2 border-[#121212] rounded-full" />
              )}
            </button>
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-black uppercase tracking-tighter text-sm leading-none">{profile.name}</span>
              <span className="font-bold text-[10px] uppercase tracking-widest opacity-50">Root Access</span>
            </div>
            
            <div className="w-12 h-12 bg-[#F0C020] border-2 border-[#121212] rounded-full flex items-center justify-center font-black uppercase tracking-tighter shrink-0 text-xl">
               NA
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Outlet handles the pages */}
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}
