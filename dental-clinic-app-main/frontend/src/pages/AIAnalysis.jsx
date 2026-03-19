import { useState, useEffect, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const STATUS_COLORS = {
    Confirmed: '#22c55e',
    Pending: '#f59e0b',
    Cancelled: '#ef4444',
    Completed: '#3b82f6'
};

const DOCTOR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#14b8a6'];

function AIAnalysis() {
    const [message, setMessage] = useState('');
    const [threadId, setThreadId] = useState(null); // NEW: Thread ID for Assistants API
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: "👋 Hi! I'm your dental clinic AI assistant. Ask me anything about appointments, doctors, or patient data!" }
    ]);
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [chartsLoading, setChartsLoading] = useState(true);
    const chatEndRef = useRef(null);

    const token = localStorage.getItem('token');

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [chatHistory]);

    // Initialize Thread and Data
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Create Thread
                const threadRes = await fetch(`${API_BASE_URL}/api/ai-agent/create-thread`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
                const threadData = await threadRes.json();
                setThreadId(threadData.threadId);

                // 2. Fetch Charts
                fetchChartData();
            } catch (err) { console.error("Init failed", err); }
        };
        init();
    }, []);

    const fetchChartData = async () => {
        setChartsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-agent/charts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setChartData(data);
        } catch (err) { console.error('Chart fetch error:', err); }
        finally { setChartsLoading(false); }
    };

    const sendMessage = async () => {
        if (!message.trim() || loading || !threadId) return;
        const userMsg = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-agent/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMsg, threadId: threadId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');

            setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    const quickQuestions = [
        "How many appointments this week?",
        "Which doctor has the most appointments?",
        "What is the most common procedure?",
        "Which patients missed appointments?"
    ];

    const statusData = chartData?.statusBreakdown?.map(s => ({ name: s.status, value: parseInt(s.count) })) || [];

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">🤖 <span>AI Analysis</span></h1>
                <p className="text-gray-500 font-medium mt-1">Powered by OpenAI Assistants API.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 flex flex-col gap-4">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '520px' }}>
                        <div className="p-5 border-b border-gray-50"><h2 className="font-black text-gray-800">💬 Ask the AI</h2></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && <div className="text-xs text-gray-400 animate-pulse">AI is thinking...</div>}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                            {quickQuestions.map((q, i) => (
                                <button key={i} onClick={() => setMessage(q)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold hover:bg-indigo-100">{q}</button>
                            ))}
                        </div>
                        <div className="p-4 pt-0 flex gap-2">
                            <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" rows={2} />
                            <button onClick={sendMessage} disabled={loading || !message.trim()} className="bg-indigo-600 text-white px-4 rounded-xl font-black text-sm">↑</button>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-black text-gray-800 mb-4">📅 Appointments Per Day</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData?.appointmentsPerDay || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIAnalysis;