import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function PatientAI() {
    const [message, setMessage] = useState('');
    const [threadId, setThreadId] = useState(null); // NEW: Store the thread
    const [chatHistory, setChatHistory] = useState([/* ... */]);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    // NEW: Create thread when component mounts
    useEffect(() => {
        const initThread = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/ai-agent/create-thread`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                setThreadId(data.threadId);

                // Optional: If you want the AI to start the conversation, 
                // you could send a "Hello" message here automatically.
            } catch (err) {
                console.error("Failed to create thread", err);
            }
        };
        initThread();
    }, []);

    const sendMessage = async () => {
        if (!message.trim() || loading || !threadId) return; // Ensure threadId exists

        const userMsg = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-agent/patient/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                // Send threadId instead of history
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

    // ... rest of your component
}

export default PatientAI;
