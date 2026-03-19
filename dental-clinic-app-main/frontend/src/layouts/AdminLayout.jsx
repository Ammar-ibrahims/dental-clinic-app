import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

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

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <span className="text-2xl">🦷</span> ADMIN PORTAL
                    </h1>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
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
            <div className="flex-grow flex flex-col">
                <header className="bg-white border-b h-16 flex items-center justify-between px-8 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Management'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            A
                        </div>
                        <span className="text-sm font-medium text-gray-600">Administrator</span>
                    </div>
                </header>

                <main className="p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
