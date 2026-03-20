import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function FloatingChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [message, setMessage] = useState('');
    const [threadId, setThreadId] = useState(null);
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: "👋 Hi! I'm your dental assistant. How can I help you today?" }
    ]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);
    const token = localStorage.getItem('token');

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, loading]);

    // Show tooltip after a short delay, but only if not dismissed before
    useEffect(() => {
        const isDismissed = localStorage.getItem('hide_ai_tooltip');
        const timer = setTimeout(() => {
            if (!isOpen && !isDismissed) setShowTooltip(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    // Create thread on first open
    useEffect(() => {
        if (isOpen && !threadId) {
            const initThread = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/ai-agent/patient/create-thread`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    });
                    const data = await res.json();
                    setThreadId(data.threadId);
                } catch (err) {
                    console.error("Failed to create thread", err);
                }
            };
            initThread();
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!message.trim() || loading || !threadId) return;
        const userMsg = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-agent/patient/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: userMsg, threadId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <>
            {/* Floating Chat Panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '90px', right: '24px', width: '370px', maxHeight: '520px',
                    zIndex: 9999, display: 'flex', flexDirection: 'column',
                    borderRadius: '20px', overflow: 'hidden',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb', background: '#fff'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                            }}>🤖</div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px' }}>AI Assistant</div>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600 }}>
                                    {threadId ? '● Online' : 'Connecting...'}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{
                            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                            width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                            fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                        maxHeight: '340px', minHeight: '280px', background: '#f9fafb'
                    }}>
                        {chatHistory.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    maxWidth: '82%', padding: '10px 14px', borderRadius: '16px',
                                    fontSize: '13px', lineHeight: '1.5', fontWeight: 500,
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    ...(msg.role === 'user'
                                        ? { background: '#3b82f6', color: '#fff', borderBottomRightRadius: '4px' }
                                        : { background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderBottomLeftRadius: '4px' }
                                    )
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    background: '#fff', border: '1px solid #e5e7eb', padding: '10px 16px',
                                    borderRadius: '16px', borderBottomLeftRadius: '4px',
                                    fontSize: '12px', color: '#9ca3af', fontWeight: 600
                                }}>
                                    Typing...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Dismiss for this session */}
                    {!isOpen && showTooltip && (
                        <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                            <button 
                                onClick={() => { setShowTooltip(false); localStorage.setItem('hide_ai_tooltip', 'true'); }}
                                style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                            >Don't show this again</button>
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        borderTop: '1px solid #e5e7eb', padding: '12px 14px',
                        display: 'flex', gap: '8px', background: '#fff'
                    }}>
                        <input
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            disabled={!threadId}
                            style={{
                                flex: 1, border: '1px solid #e5e7eb', borderRadius: '12px',
                                padding: '10px 14px', fontSize: '13px', outline: 'none',
                                fontWeight: 500, background: '#f9fafb'
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !message.trim() || !threadId}
                            style={{
                                background: loading || !message.trim() ? '#c7d2fe' : '#3b82f6',
                                color: '#fff', border: 'none', borderRadius: '12px',
                                width: '42px', height: '42px', cursor: 'pointer',
                                fontSize: '16px', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >↑</button>
                    </div>
                </div>
            )}

            {/* Welcome Tooltip */}
            {!isOpen && showTooltip && (
                <div 
                    className="ai-tooltip"
                    style={{
                        position: 'fixed', bottom: '32px', right: '92px', zIndex: 9998,
                        background: '#fff', padding: '12px 18px', borderRadius: '18px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #eef2f6',
                        fontSize: '14px', fontWeight: 600, color: '#1e293b',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>👋</span>
                    <span>I am AI assistant, let's book appointment</span>
                    
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute', right: '-6px', top: '50%', 
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: '12px', height: '12px', background: '#fff', 
                        borderRight: '1px solid #eef2f6', borderTop: '1px solid #eef2f6'
                    }} />
                    
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setShowTooltip(false); 
                            localStorage.setItem('hide_ai_tooltip', 'true');
                        }}
                        style={{ 
                            marginLeft: '4px', color: '#94a3b8', border: 'none', 
                            background: 'none', cursor: 'pointer', fontSize: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '4px', borderRadius: '50%', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                    >✕</button>

                    <style>{`
                        @keyframes slideIn {
                            from { opacity: 0; transform: translateX(20px); }
                            to { opacity: 1; transform: translateX(0); }
                        }
                    `}</style>
                </div>
            )}

            {/* Floating Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="ai-bubble-btn"
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    boxShadow: '0 6px 24px rgba(59,130,246,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @media (max-width: 768px) {
                    .ai-bubble-btn {
                        bottom: 85px !important; /* Adjusted to sit right above the mobile nav */
                        right: 16px !important;
                        width: 48px !important;
                        height: 48px !important;
                    }
                    .ai-tooltip {
                        bottom: 140px !important;
                        right: 16px !important;
                        padding: 8px 14px !important;
                        font-size: 12px !important;
                    }
                }
            `}</style>
        </>
    );
}

export default FloatingChatWidget;
