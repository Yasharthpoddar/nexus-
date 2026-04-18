import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { useLab } from '../context/LabContext';
import { 
  Menu, X, Bell, LogOut, LayoutDashboard, 
  ClipboardList, CheckSquare, Settings, 
  HelpCircle, MonitorSmartphone, AlertCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function LabLayout() {
  const { profile } = useLab();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('pending')) return 'Pending Clearances';
    if (path.includes('review/')) return 'Review Application';
    if (path.includes('reviewed')) return 'Reviewed Applications';
    if (path.includes('equipment')) return 'Lab Equipment Tracker';
    if (path.includes('notifications')) return 'Notifications';
    if (path.includes('help')) return 'Help & Support';
    return '';
  };

  const navLinks = [
    { name: 'Dashboard', path: '/lab/dashboard', icon: LayoutDashboard },
    { name: 'Pending Clearances', path: '/lab/pending', icon: ClipboardList },
    { name: 'Reviewed Applications', path: '/lab/reviewed', icon: CheckSquare },
    { name: 'Lab Equipment Tracker', path: '/lab/equipment', icon: MonitorSmartphone },
    { name: 'Notifications', path: '/lab/notifications', icon: Bell },
    { name: 'Help', path: '/lab/help', icon: HelpCircle },
  ];

  const handleLogout = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#121212] font-sans flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden border-b-4 border-[#121212] bg-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center shrink-0">
             <span className="font-black text-sm tracking-tight leading-none translate-x-[1px]">NU</span>
          </div>
          <div>
            <div className="font-black text-sm uppercase tracking-widest">{getPageTitle()}</div>
            <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Lab In-charge Portal</div>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 border-2 border-[#121212]">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar & Mobile Menu Overlay */}
      <AnimatePresence>
        {(mobileMenuOpen || window.innerWidth >= 768) && (
          <motion.div 
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'tween', duration: 0.2 }}
            className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r-4 border-[#121212] flex flex-col z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          >
            {/* Sidebar Logo Area */}
            <div className="p-6 border-b-4 border-[#121212] hidden md:flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center shrink-0">
                 <span className="font-black text-lg tracking-tight leading-none translate-x-[1px]">NU</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter uppercase leading-none">Nexus</span>
                <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Portal V1.0</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
              <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2 px-2 mt-2">Menu Area</div>
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 border-2 transition-all font-black text-xs uppercase tracking-widest ${
                      isActive ? 'bg-[#121212] text-white border-[#121212] shadow-[4px_4px_0px_0px_#F0C020]' : 'border-transparent hover:border-[#121212] hover:bg-[#F9F9F9]'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Profile Footer Area */}
            <div className="p-4 border-t-4 border-[#121212] bg-[#F9F9F9]">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-[#1040C0] border-2 border-[#121212] text-white flex items-center justify-center font-black text-sm shrink-0">
                   {profile.initials}
                 </div>
                 <div className="flex flex-col overflow-hidden">
                   <span className="font-black text-xs uppercase truncate tracking-widest">{profile.name}</span>
                   <span className="text-[10px] uppercase font-bold opacity-60 truncate tracking-widest">{profile.email}</span>
                 </div>
               </div>
               <button 
                 onClick={handleLogout}
                 className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#121212] font-black uppercase text-xs tracking-widest hover:bg-[#D02020] hover:text-white transition-colors"
               >
                 <LogOut className="w-4 h-4" /> Logout
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Desktop Top Navbar */}
        <div className="hidden md:flex h-20 bg-white border-b-4 border-[#121212] px-8 items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <h1 className="font-black text-2xl uppercase tracking-tighter">{getPageTitle()}</h1>
            <div className="bg-[#1040C0] text-white font-black uppercase text-[10px] tracking-widest px-3 py-1.5 border-2 border-[#121212]">
              {profile.role}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 hover:bg-[#F9F9F9] border-2 border-transparent hover:border-[#121212] transition-colors rounded-full">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-3 h-3 bg-[#D02020] border-2 border-white rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#121212 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 h-full">
             <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
