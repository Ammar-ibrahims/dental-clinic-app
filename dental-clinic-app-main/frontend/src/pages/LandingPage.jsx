import { Link } from 'react-router-dom';

function LandingPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center max-w-2xl">
                <span className="text-8xl mb-8 block">🦷</span>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">
                    SmileCare <span className="text-blue-600">Digital</span>
                </h1>
                <p className="text-xl text-slate-500 font-medium mb-12">
                    Modern dental management for patients and professionals.
                    Choose your portal to continue.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        to="/patient/login"
                        className="group bg-white p-8 rounded-3xl shadow-xl border border-blue-100 hover:border-blue-500 transition-all flex flex-col items-center text-center"
                    >
                        <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            👤
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Patient Portal</h2>
                        <p className="text-slate-500 text-sm">Book appointments, view history & invoices</p>
                    </Link>

                    <Link
                        to="/admin/login"
                        className="group bg-slate-900 p-8 rounded-3xl shadow-xl hover:bg-slate-800 transition-all flex flex-col items-center text-center"
                    >
                        <div className="h-16 w-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-500 transition-colors">
                            🛡️
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Staff Portal</h2>
                        <p className="text-slate-400 text-sm">Manage clinic operations, doctors & reports</p>
                    </Link>
                </div>
            </div>

            <footer className="mt-20 text-slate-400 text-sm font-medium">
                &copy; {new Date().getFullYear()} SmileCare Systems. Premium Healthcare Management.
            </footer>
        </div>
    );
}

export default LandingPage;
