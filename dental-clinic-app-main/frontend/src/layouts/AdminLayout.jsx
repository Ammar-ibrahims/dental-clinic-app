import React, { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/admin/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: '📊' },
        { label: 'Patients', path: '/admin/patients', icon: '👥' },
        { label: 'Doctors', path: '/admin/doctors', icon: '👨‍⚕️' },
        { label: 'Appointments', path: '/admin/appointments', icon: '📅' },
        { label: 'Reports', path: '/admin/reports', icon: '📈' },
        { label: 'AI Analysis', path: '/admin/ai-analysis', icon: '🤖' },
        { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-x-hidden">
            {/* Sidebar Overlay (Mobile only) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <span className="text-2xl">🦷</span> ADMIN PORTAL
                    </h1>
                    <button className="lg:hidden text-white p-2" onClick={() => setIsSidebarOpen(false)}>
                        ✕
                    </button>
                </div>

                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <span>🚪</span>
                        <span className="font-medium">Logout Admin</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-grow flex flex-col w-full min-w-0">
                <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button 
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            onClick={toggleSidebar}
                        >
                            ☰
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-none">
                            {navItems.find(i => i.path === location.pathname)?.label || 'Management'}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            A
                        </div>
                        <span className="text-sm font-medium text-gray-600 hidden sm:inline">Administrator</span>
                    </div>
                </header>

                <main className="p-4 sm:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
