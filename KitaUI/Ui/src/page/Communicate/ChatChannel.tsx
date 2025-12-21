import { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import type { MessageDto, ChannelDto } from '../../types/api';
import { Gift, Sticker, Smile, Send, MoreHorizontal, Pencil, Trash2, X, Check, Image } from 'lucide-react';

interface ChatChannelProps {
    channel: ChannelDto;
    onMemberClick?: (senderId: string, senderName: string, senderAvatar?: string) => void;
}

// Helper to get the date string from message
const getMessageDate = (msg: MessageDto): string => {
    return msg.sentAt || msg.createdAt || new Date().toISOString();
};

export default function ChatChannel({ channel, onMemberClick }: ChatChannelProps) {
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [contextMenuId, setContextMenuId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
                setCurrentUserId(payload[nameIdentifierClaim] || payload.sub || payload.nameid);
            } catch (error) {
                console.error("Failed to parse JWT", error);
            }
        }
    }, []);

    useEffect(() => {
        loadMessages();
        joinChannel();

        return () => {
            leaveChannel();
            chatService.clearCallbacks();
        }
    }, [channel.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const joinChannel = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token && !chatService.isConnected()) {
                await chatService.connect(token);
            }
            if (chatService.isConnected()) {
                await chatService.joinChannel(channel.id);

                chatService.onMessageReceived((msg) => {
                    if (msg.channelId === channel.id) {
                        setMessages(prev => [...prev, msg]);
                    }
                });

                chatService.onMessageEdited((msg) => {
                    if (msg.channelId === channel.id) {
                        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
                    }
                });

                chatService.onMessageDeleted((messageId) => {
                    setMessages(prev => prev.filter(m => m.id !== messageId));
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    const leaveChannel = async () => {
        if (chatService.isConnected()) {
            await chatService.leaveChannel(channel.id);
        }
    }

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const msgs = await chatService.fetchChannelMessages(channel.id);
            setMessages(msgs.sort((a, b) =>
                new Date(getMessageDate(a)).getTime() - new Date(getMessageDate(b)).getTime()
            ));
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await chatService.sendMessage(channel.id, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const cancelImageUpload = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendImageMessage = async () => {
        if (!selectedImage) return;
        setIsUploading(true);
        try {
            const result = await chatService.sendImageMessage(channel.id, selectedImage, newMessage || undefined);
            if (result) {
                setMessages(prev => [...prev, result]);
            }
            cancelImageUpload();
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send image", error);
        } finally {
            setIsUploading(false);
        }
    };

    const startEditing = (msg: MessageDto) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
        setContextMenuId(null);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const saveEdit = async (messageId: string) => {
        if (!editContent.trim()) return;
        try {
            const updated = await chatService.updateMessage(channel.id, messageId, { content: editContent });
            if (updated) {
                setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
            }
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error("Failed to edit message", error);
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            const success = await chatService.deleteMessage(channel.id, messageId);
            if (success) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            }
            setContextMenuId(null);
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const getSenderName = (msg: MessageDto): string => {
        return msg.senderName || msg.username || 'Unknown';
    };

    return (
        <div className="flex flex-col h-full bg-[#120c12]" onClick={() => setContextMenuId(null)}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 rounded-full border-2 border-[#ff7a3c] border-t-transparent animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="mt-10 mb-6 text-center">
                        <div className="w-16 h-16 bg-[#ffffff08] rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl text-[#ffffff30]">#</span>
                        </div>
                        <h1 className="text-white text-3xl font-bold mb-2">Welcome to #{channel.name}</h1>
                        <p className="text-[#ffffff50]">This is the start of the #{channel.name} channel.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, idx) => {
                            const prevMsg = messages[idx - 1];
                            const msgDate = getMessageDate(msg);
                            const prevMsgDate = prevMsg ? getMessageDate(prevMsg) : '';
                            const showHeader = idx === 0 ||
                                prevMsg?.senderId !== msg.senderId ||
                                (new Date(msgDate).getTime() - new Date(prevMsgDate).getTime() > 300000);

                            const isOwner = msg.senderId === currentUserId;
                            const isEditing = editingMessageId === msg.id;

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`group flex gap-4 relative ${showHeader ? 'mt-2' : 'mt-0.5'}`}
                                >
                                    {showHeader ? (
                                        <button
                                            onClick={() => onMemberClick?.(msg.senderId, getSenderName(msg), msg.senderAvatarUrl)}
                                            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg mt-0.5 overflow-hidden hover:opacity-80 transition-opacity"
                                        >
                                            {msg.senderAvatarUrl ? (
                                                <img src={msg.senderAvatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#ff7a3c] to-purple-600 flex items-center justify-center">
                                                    {getSenderName(msg).substring(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-10 flex-shrink-0 text-[10px] text-[#ffffff30] opacity-0 group-hover:opacity-100 text-right pr-2 pt-1">
                                            {new Date(msgDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {showHeader && (
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <button
                                                    onClick={() => onMemberClick?.(msg.senderId, getSenderName(msg), msg.senderAvatarUrl)}
                                                    className="text-white font-medium hover:underline cursor-pointer"
                                                >
                                                    {getSenderName(msg)}
                                                </button>
                                                <span className="text-xs text-[#ffffff40]">
                                                    {new Date(msgDate).toLocaleString()}
                                                </span>
                                                {msg.isEdited && (
                                                    <span className="text-xs text-[#ffffff30]">(edited)</span>
                                                )}
                                            </div>
                                        )}

                                        {isEditing ? (
                                            <div className="bg-[#1a141a] rounded-lg p-2 border border-[#ffffff15]">
                                                <input
                                                    type="text"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEdit(msg.id);
                                                        if (e.key === 'Escape') cancelEditing();
                                                    }}
                                                    className="w-full bg-transparent text-white outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex items-center gap-2 mt-2 text-xs">
                                                    <button
                                                        onClick={() => saveEdit(msg.id)}
                                                        className="flex items-center gap-1 text-green-500 hover:text-green-400"
                                                    >
                                                        <Check size={12} /> Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="flex items-center gap-1 text-[#ffffff50] hover:text-white"
                                                    >
                                                        <X size={12} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {msg.imageUrl && (
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Sent image"
                                                        className="max-w-md max-h-80 rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(msg.imageUrl, '_blank')}
                                                    />
                                                )}
                                                {msg.content && (
                                                    <p className={`text-[#ffffff90] whitespace-pre-wrap leading-relaxed ${!showHeader && 'hover:bg-[#ffffff05] -ml-2 pl-2 rounded'}`}>
                                                        {msg.content}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Action buttons - only show for owner's messages */}
                                    {isOwner && !isEditing && (
                                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContextMenuId(contextMenuId === msg.id ? null : msg.id);
                                                }}
                                                className="p-1.5 hover:bg-[#ffffff10] rounded text-[#ffffff50] hover:text-white"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>

                                            {/* Context Menu */}
                                            {contextMenuId === msg.id && (
                                                <div
                                                    className="absolute right-0 top-8 bg-[#1a141a] rounded-lg shadow-xl border border-[#ffffff15] py-1 min-w-[120px] z-10"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => startEditing(msg)}
                                                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#ffffff10] flex items-center gap-2"
                                                    >
                                                        <Pencil size={14} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMessage(msg.id)}
                                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#ffffff10] flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="px-6 py-6 pt-2">
                {/* Image Preview */}
                {imagePreview && (
                    <div className="mb-2 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                        <button
                            onClick={cancelImageUpload}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="bg-[#1a141a] rounded-xl p-2 flex items-center gap-2 border border-[#ffffff0d] shadow-lg focus-within:border-[#ff7a3c]/50 transition-colors">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#ffffff40] hover:text-[#ff7a3c] transition-colors p-2 rounded-lg hover:bg-[#ffffff05]"
                        title="Upload Image"
                    >
                        <Image size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder={selectedImage ? 'Add a caption...' : `Message #${channel.name}`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (selectedImage ? sendImageMessage() : sendMessage())}
                        className="flex-1 bg-transparent text-white placeholder-[#ffffff30] outline-none text-sm px-2"
                    />
                    <div className="flex items-center gap-1 mr-1">
                        <button className="text-[#ffffff40] hover:text-[#ff7a3c] transition-colors p-2 rounded-lg hover:bg-[#ffffff05]">
                            <Gift size={20} />
                        </button>
                        <button className="text-[#ffffff40] hover:text-[#ff7a3c] transition-colors p-2 rounded-lg hover:bg-[#ffffff05]">
                            <Sticker size={20} />
                        </button>
                        <button className="text-[#ffffff40] hover:text-[#ff7a3c] transition-colors p-2 rounded-lg hover:bg-[#ffffff05]">
                            <Smile size={20} />
                        </button>
                        {(newMessage.length > 0 || selectedImage) && (
                            <button
                                onClick={selectedImage ? sendImageMessage : sendMessage}
                                disabled={isUploading}
                                className={`text-[#ff7a3c] hover:text-white transition-colors p-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-[#ff7a3c] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
