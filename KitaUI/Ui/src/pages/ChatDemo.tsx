// SimpleChat.tsx
import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import type { MessageDto } from '../types/api';

export default function SimpleChat() {
    const CHANNEL_ID = "490fd738-3275-404f-94d1-3c452abb0521";

    const [token, setToken] = useState("");
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ✅ Auto-load token từ localStorage khi mount
    useEffect(() => {
        const savedToken = localStorage.getItem('jwt_token');
        if (savedToken) {
            console.log('📦 Found saved token, auto-connecting...');
            setToken(savedToken);
            // Auto connect nếu có token
            autoConnect(savedToken);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ Auto connect function
    const autoConnect = async (savedToken: string) => {
        setIsConnecting(true);
        try {
            await connectToChat(savedToken);
        } catch (err) {
            console.error('❌ Auto-connect failed:', err);
            // Không xóa token, user có thể retry
        } finally {
            setIsConnecting(false);
        }
    };

    // ✅ Logic connect tách riêng để reuse
    const connectToChat = async (authToken: string) => {
        console.log('🔵 Connecting...');
        await chatService.connect(authToken);
        setIsConnected(true);

        // Setup message handler
        chatService.onMessageReceived((msg) => {
            setMessages(prev => {
                const updated = [...prev, msg];
                return updated.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
            });
        });

        // Join channel
        await chatService.joinChannel(CHANNEL_ID);

        // Fetch existing messages
        console.log('📥 Fetching channel messages...');
        const existingMessages = await chatService.fetchChannelMessages(CHANNEL_ID, authToken);
        console.log(`✅ Loaded ${existingMessages.length} messages`);

        const sortedMessages = existingMessages.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
    };

    const handleConnect = async () => {
        if (!token.trim()) {
            alert('Please enter a JWT token');
            return;
        }

        setIsConnecting(true);
        try {
            await connectToChat(token);

            // ✅ LƯU token vào localStorage khi connect thành công
            localStorage.setItem('jwt_token', token);
            console.log('💾 Token saved to localStorage');

        } catch (err) {
            console.error('❌ Connection error:', err);
            alert('Failed to connect. Please check your token and try again.');
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        await chatService.leaveChannel(CHANNEL_ID);
        await chatService.disconnect();
        setIsConnected(false);
        setMessages([]);

        // ✅ XÓA token khỏi localStorage khi disconnect
        localStorage.removeItem('jwt_token');
        setToken('');
        console.log('🗑️ Token removed from localStorage');
    };

    // ✅ Nút clear token (trong login screen)
    const handleClearToken = () => {
        localStorage.removeItem('jwt_token');
        setToken('');
        console.log('🗑️ Token cleared');
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !isConnected) return;

        try {
            await chatService.sendMessage(CHANNEL_ID, newMessage);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    // ✅ Loading screen khi auto-connecting
    if (isConnecting && !isConnected) {
        return (
            <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-white text-lg">Connecting to chat...</p>
                    <p className="text-gray-400 text-sm mt-2">Using saved token</p>
                </div>
            </div>
        );
    }

    // Login screen when not connected
    if (!isConnected) {
        return (
            <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">💬 Kita Chat</h1>
                            <p className="text-gray-400 text-sm">Enter your JWT token to connect</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    JWT Token
                                </label>
                                <textarea
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm"
                                    rows={4}
                                />
                            </div>

                            {/* ✅ Hiển thị nếu có token saved */}
                            {token && (
                                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                    <span className="text-xs text-green-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Token loaded from storage
                                    </span>
                                    <button
                                        onClick={handleClearToken}
                                        className="text-xs text-red-400 hover:text-red-300 underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            <div className="bg-gray-700 rounded-lg p-3 text-xs text-gray-400">
                                <p className="mb-1"><strong className="text-gray-300">Channel ID:</strong></p>
                                <p className="font-mono text-blue-400 break-all">{CHANNEL_ID}</p>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={isConnecting || !token.trim()}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {isConnecting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Connecting...
                                    </span>
                                ) : (
                                    'Connect to Chat'
                                )}
                            </button>

                            {/* ✅ Hint */}
                            <p className="text-xs text-center text-gray-500 mt-4">
                                💡 Token will be saved for next time
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Chat interface (giữ nguyên như cũ)
    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Kita Chat
                            </h2>
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Connected
                            </span>
                        </div>
                        <p className="text-xs text-gray-400">
                            Channel: <span className="text-blue-400 font-mono">{CHANNEL_ID}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">
                                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                            </p>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages (giữ nguyên) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-lg">No messages yet...</p>
                        <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-semibold text-blue-400">
                                {msg.username}
                            </span>
                            <span className="text-xs text-gray-500">
                                {new Date(msg.createdAt).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{msg.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input (giữ nguyên) */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
