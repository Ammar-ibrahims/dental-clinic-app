import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import FloatingChatWidget from '../components/FloatingChatWidget';

const PatientLayout = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Patient';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/patient/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/patient', icon: '🏠' },
        { label: 'Appointments', path: '/patient/appointments', icon: '📅' },
        { label: 'Doctors', path: '/patient/doctors', icon: '👨‍⚕️' },
        { label: 'Profile', path: '/patient/profile', icon: '👤' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header / Desktop Nav */}
            <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pointer-events-none">
                <nav className="max-w-7xl mx-auto h-16 pointer-events-auto rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg shadow-gray-200/50 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner shadow-blue-400">🦷</div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tighter hidden sm:block">DENTAL <span className="text-blue-600 italic">PORTAL</span></h1>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/patient'}
                                className={({ isActive }) => `
                                    px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2
                                    ${isActive 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105' 
                                        : 'text-gray-500 hover:bg-gray-100/80 hover:text-blue-600'}
                                `}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end mr-2">
                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Welcome back</span>
                            <span className="text-sm font-bold text-gray-700">{userName}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm border border-red-100"
                        >
                            Logout
                        </button>
                    </div>
                </nav>
            </header>

            {/* Content Area */}
            <main className="flex-grow pt-24 pb-24 md:pb-8">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <Outlet />
                </div>
            </main>

            {/* Floating Mobile Nav - Modern Bottom Bar */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm">
                <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-2.5 flex justify-between items-center shadow-2xl shadow-blue-900/20">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/patient'}
                            className={({ isActive }) => `
                                flex items-center justify-center w-16 h-14 rounded-2xl transition-all duration-500
                                ${isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                    : 'text-gray-400 hover:text-white'}
                            `}
                        >
                            <span className="text-2xl">{item.icon}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t p-8 text-center hidden md:block">
                <div className="max-w-7xl mx-auto text-gray-400 text-sm font-medium">
                    <p className="mb-2">🦷 &copy; {new Date().getFullYear()} Patient Self-Service Portal.</p>
                    <p className="text-[10px] uppercase tracking-[0.2em]">Designed for premium dental care experience</p>
                </div>
            </footer>

            {/* Floating AI Assistant */}
            <FloatingChatWidget />

            <style>{`
                /* Hide main header when small scrolling happens but keep sticky feel */
                header nav {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Custom spacing for the floating assistant bubble so it doesn't overlap mobile nav on some screens */
                @media (max-width: 768px) {
                    .assistant-bubble-adjust {
                        bottom: 90px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PatientLayout;
