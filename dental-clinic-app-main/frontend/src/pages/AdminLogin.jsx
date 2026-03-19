import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            if (data.role !== 'admin') {
                throw new Error('Access denied. This login is for administrators only.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('userName', 'Administrator');

            navigate('/admin');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <span className="text-5xl">🛡️</span>
                    <h2 className="mt-4 text-3xl font-black text-slate-800 tracking-tight">Clinic Admin</h2>
                    <p className="text-slate-500 mt-2 font-medium">Management System Access</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100 font-medium">
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Admin Email</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-4 rounded-lg bg-slate-50 border-2 border-slate-100 focus:border-blue-600 outline-none transition-all font-medium"
                            placeholder="admin@clinic.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-4 rounded-lg bg-slate-50 border-2 border-slate-100 focus:border-blue-600 outline-none transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg shadow-xl transition-all disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/patient/login" className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                        ← Back to Patient Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
