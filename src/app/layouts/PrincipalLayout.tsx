import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { usePrincipal } from '../context/PrincipalContext';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, Bell, LogOut, LayoutDashboard, 
  Inbox, CheckSquare, FileBarChart, HelpCircle
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from 'motion/react';

export function PrincipalLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, notifications } = usePrincipal();
  const { currentUser, logout } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('pending')) return 'Pending Applications';
    if (location.pathname.includes('reviewed')) return 'Reviewed Applications';
    if (location.pathname.includes('review')) return 'Review Application';
    if (location.pathname.includes('notifications')) return 'Notifications';
    if (location.pathname.includes('reports')) return 'Department Reports';
    if (location.pathname.includes('help')) return 'Help & Support';
    return '';
  };

  const basePath = `/principal`;

  const navLinks = [
    { name: 'Dashboard', path: `${basePath}/dashboard`, icon: <LayoutDashboard size={20} /> },
    { name: 'Pending Applications', path: `${basePath}/pending`, icon: <Inbox size={20} /> },
    { name: 'Reviewed Applications', path: `${basePath}/reviewed`, icon: <CheckSquare size={20} /> },
    { name: 'Notifications', path: `${basePath}/notifications`, icon: <Bell size={20} /> },
    { name: 'Department Reports', path: `${basePath}/reports`, icon: <FileBarChart size={20} /> },
    { name: 'Help', path: `${basePath}/help`, icon: <HelpCircle size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-y-auto w-72 border-r-4 border-[#F0C020]">
      <div className="p-6 border-b-2 border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          {/* Mobile close */}
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <p className="font-bold text-xs uppercase tracking-widest text-[#F0C020] opacity-90 border border-[#F0C020] inline-block px-2 py-1">Authority Portal</p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 font-bold uppercase text-xs tracking-widest transition-all
              ${isActive 
                ? 'bg-[#F0C020] text-[#121212]' 
                : 'text-white/70 hover:bg-white/10 hover:text-white'}
            `}
          >
            {link.icon}
            {link.name}
            {link.name === 'Notifications' && unreadCount > 0 && (
               <span className="ml-auto bg-[#D02020] text-white px-2 py-0.5 rounded-full text-[10px]">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t-2 border-white/20">
         <button onClick={handleLogout} className="flex items-center gap-4 text-white/70 hover:text-white font-bold uppercase text-xs tracking-widest w-full px-4 py-3 hover:bg-[#D02020] hover:text-white transition-colors">
            <LogOut size={20} />
            Log Out
         </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen fixed top-0 left-0 z-40">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
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
              className="relative w-72 h-full shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b-4 border-[#121212] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-[#121212]" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="font-black text-xl lg:text-3xl uppercase tracking-tight hidden sm:block truncate">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <button className="relative p-2 text-[#121212] hover:bg-[#F0F0F0] rounded-full transition-colors" onClick={() => navigate(`${basePath}/notifications`)}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D02020] rounded-full border-2 border-white" />
              )}
            </button>
            
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="font-black uppercase tracking-tight text-sm leading-tight">{currentUser?.name}</span>
              <span className="font-bold text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#1040C0]" /> Principal • {profile.department}
              </span>
            </div>
            
            <div className="w-10 h-10 bg-[#121212] text-white border-2 border-[#121212] flex items-center justify-center font-black uppercase overflow-hidden shrink-0">
               {currentUser?.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
            </div>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}
