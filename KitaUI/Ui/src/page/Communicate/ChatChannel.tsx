import { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import type { MessageDto, ChannelDto } from '../../types/api';
import { Gift, Sticker, Smile, Send, MoreHorizontal, Pencil, Trash2, X, Check, Image, Copy, ExternalLink } from 'lucide-react';

interface ChatChannelProps {
    channel: ChannelDto;
    onMemberClick?: (event: React.MouseEvent, senderId: string, senderName: string, senderAvatar?: string) => void;
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
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
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
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const cancelImageUpload = () => {
        setSelectedImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const sendImageMessage = async () => {
        if (selectedImages.length === 0) return;
        setIsUploading(true);
        try {
            // Send requests in parallel
            const uploadPromises = selectedImages.map((file, index) => {
                // Attach caption only to the first image if multiple are sent
                const caption = index === 0 ? newMessage : undefined;
                return chatService.sendImageMessage(channel.id, file, caption);
            });

            const results = await Promise.all(uploadPromises);

            const successfulMessages = results.filter((msg): msg is MessageDto => msg !== null);
            if (successfulMessages.length > 0) {
                setMessages(prev => [...prev, ...successfulMessages]);
            }

            cancelImageUpload();
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send images", error);
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
            await chatService.updateMessage(channel.id, messageId, { content: editContent });
            // Update will be handled by onMessageEdited callback
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error("Failed to edit message", error);
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            await chatService.deleteMessage(channel.id, messageId);
            // Delete will be handled by onMessageDeleted callback
            setContextMenuId(null);
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const getSenderName = (msg: MessageDto): string => {
        return msg.senderName || msg.username || 'Unknown';
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] relative" onClick={() => setContextMenuId(null)}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] pointer-events-none" />

            <div className="h-14 px-6 flex items-center border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm z-10 sticky top-0">
                <span className="text-2xl text-[#FF8C00] mr-2 opacity-80">#</span>
                <h3 className="text-white font-bold font-['Lexend'] tracking-wide">{channel.name}</h3>
            </div>


            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar relative z-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-10 h-10 rounded-full border-2 border-[#FF8C00] border-t-transparent animate-spin ring-4 ring-[#FF8C00]/10"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="mt-10 mb-6 text-center">
                        <div className="w-20 h-20 bg-[#ffffff05] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <span className="text-5xl text-white/20">#</span>
                        </div>
                        <h1 className="text-white text-3xl font-bold mb-2 font-['Lexend']">Welcome to #{channel.name}</h1>
                        <p className="text-[#a0a0a0]">This is the start of the #{channel.name} channel.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 pb-4">
                        {messages.map((msg, idx) => {
                            const prevMsg = messages[idx - 1];
                            const msgDate = getMessageDate(msg);
                            const prevMsgDate = prevMsg ? getMessageDate(prevMsg) : '';
                            const showHeader = idx === 0 ||
                                prevMsg?.senderId !== msg.senderId ||
                                (new Date(msgDate).getTime() - new Date(prevMsgDate).getTime() > 300000);

                            const isOwner = msg.senderId === currentUserId;
                            const isEditing = editingMessageId === msg.id;

                            const bubbleStyle = 'text-white/90';

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`group flex gap-4 relative ${showHeader ? 'mt-4' : 'mt-1'} flex-row`}
                                >
                                    {showHeader && (
                                        <button
                                            onClick={(e) => onMemberClick?.(e, msg.senderId, getSenderName(msg), msg.senderAvatarUrl)}
                                            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-[#1a1a1a] border border-white/10 shadow-lg overflow-hidden hover:ring-2 hover:ring-[#FF8C00] transition-all"
                                        >
                                            {msg.senderAvatarUrl ? (
                                                <img src={msg.senderAvatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center text-[#FF8C00] font-bold">
                                                    {getSenderName(msg).substring(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                        </button>
                                    )}

                                    {!showHeader && <div className="w-10 flex-shrink-0" />}

                                    <div className="flex flex-col items-start flex-1">
                                        {showHeader && (
                                            <div className="flex items-baseline gap-2 mb-1 flex-row">
                                                <button
                                                    onClick={(e) => onMemberClick?.(e, msg.senderId, getSenderName(msg), msg.senderAvatarUrl)}
                                                    className="text-white font-bold text-sm hover:underline cursor-pointer"
                                                >
                                                    {getSenderName(msg)}
                                                </button>
                                                <span className="text-[10px] text-[#a0a0a0] font-medium">
                                                    {new Date(msgDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}

                                        {isEditing ? (
                                            <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#FF8C00]/50 w-full min-w-[300px] shadow-[0_0_15px_rgba(255,140,0,0.1)]">
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
                                                <div className="flex items-center gap-2 mt-2 text-xs justify-end">
                                                    <button
                                                        onClick={() => saveEdit(msg.id)}
                                                        className="flex items-center gap-1 text-[#FF8C00] hover:text-[#FF4D00] font-medium px-2 py-1 rounded hover:bg-[#FF8C00]/10"
                                                    >
                                                        <Check size={12} /> Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="flex items-center gap-1 text-[#a0a0a0] hover:text-white px-2 py-1 rounded hover:bg-white/5"
                                                    >
                                                        <X size={12} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`relative text-[15px] leading-relaxed  ${bubbleStyle}`}>
                                                {msg.imageUrl && (
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Sent image"
                                                        className="max-w-[350px] max-h-[350px] w-auto h-auto object-contain rounded-lg mb-2 cursor-pointer hover:opacity-95 transition-opacity border border-white/5"
                                                        onClick={() => setViewingImage(msg.imageUrl || null)}
                                                    />
                                                )}
                                                {msg.content && (
                                                    <p className="whitespace-pre-wrap hover:bg-white/5 px-1 -mx-1 rounded transition-colors">
                                                        {msg.content}
                                                        {msg.isEdited && (
                                                            <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {(isOwner || msg.imageUrl) && !isEditing && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2 relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContextMenuId(contextMenuId === msg.id ? null : msg.id);
                                                }}
                                                className="p-1.5 bg-[#1a1a1a] border border-white/10 rounded-full text-[#a0a0a0] hover:text-[#FF8C00] hover:border-[#FF8C00] shadow-sm transition-colors"
                                            >
                                                <MoreHorizontal size={14} />
                                            </button>

                                            {contextMenuId === msg.id && (
                                                <div
                                                    className="absolute top-0 right-full mr-2 bg-[#1a1a1a] rounded-lg shadow-2xl border border-white/10 py-1 min-w-[140px] z-50 overflow-hidden"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {msg.imageUrl && (
                                                        <>
                                                            <button
                                                                onClick={() => window.open(msg.imageUrl, '_blank')}
                                                                className="w-full px-3 py-2.5 text-left text-sm text-white/90 hover:bg-[#FF8C00]/10 hover:text-[#FF8C00] flex items-center gap-2 transition-colors border-b border-white/5"
                                                            >
                                                                <ExternalLink size={14} /> Open Original
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(msg.imageUrl!);
                                                                    setContextMenuId(null);
                                                                }}
                                                                className={`w-full px-3 py-2.5 text-left text-sm text-white/90 hover:bg-[#FF8C00]/10 hover:text-[#FF8C00] flex items-center gap-2 transition-colors ${isOwner ? 'border-b border-white/5' : ''}`}
                                                            >
                                                                <Copy size={14} /> Copy Link
                                                            </button>
                                                        </>
                                                    )}
                                                    {isOwner && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditing(msg)}
                                                                className="w-full px-3 py-2.5 text-left text-sm text-white/90 hover:bg-[#FF8C00]/10 hover:text-[#FF8C00] flex items-center gap-2 transition-colors"
                                                            >
                                                                <Pencil size={14} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => deleteMessage(msg.id)}
                                                                className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </>
                                                    )}
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


            <div className="px-6 py-6 pt-2 relative z-20">
                {imagePreviews.length > 0 && (
                    <div className="mb-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative inline-block animate-slideUp flex-shrink-0">
                                <img src={preview} alt={`Preview ${index}`} className="h-40 w-auto rounded-xl border border-[#FF8C00]/30 shadow-lg object-cover" />
                                <button
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md transform hover:scale-110"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-full p-1.5 pl-4 flex items-center gap-3 border border-white/5 shadow-lg relative group transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(255,140,0,0.2)] focus-within:border-[#FF8C00]/50 hover:border-white/10">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[#a0a0a0] hover:text-[#FF8C00] transition-colors p-2 rounded-full hover:bg-white/5"
                            title="Upload Image"
                        >
                            <Image size={20} />
                        </button>

                        <div className="w-px h-5 bg-white/10" />

                        <input
                            type="text"
                            placeholder={selectedImages.length > 0 ? `Add a caption to the first image...` : `Message #${channel.name}`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (selectedImages.length > 0 ? sendImageMessage() : sendMessage())}
                            className="flex-1 bg-transparent text-white placeholder-[#a0a0a0] outline-none text-[15px] "
                        />

                        <div className="flex items-center gap-1 pr-1">
                            <button className="text-[#a0a0a0] hover:text-[#FF8C00] transition-colors p-2 rounded-full hover:bg-white/5">
                                <Gift size={20} />
                            </button>
                            <button className="text-[#a0a0a0] hover:text-[#FF8C00] transition-colors p-2 rounded-full hover:bg-white/5">
                                <Sticker size={20} />
                            </button>
                            <button className="text-[#a0a0a0] hover:text-[#FF8C00] transition-colors p-2 rounded-full hover:bg-white/5">
                                <Smile size={20} />
                            </button>

                            <button
                                onClick={selectedImages.length > 0 ? sendImageMessage : sendMessage}
                                disabled={(!newMessage.trim() && selectedImages.length === 0) || isUploading}
                                className={`ml-2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${(newMessage.trim() || selectedImages.length > 0) && !isUploading
                                    ? 'bg-gradient-to-br from-[#FF8C00] to-[#FF4D00] text-white shadow-[0_0_10px_rgba(255,140,0,0.4)] hover:shadow-[0_0_20px_rgba(255,140,0,0.6)] transform hover:scale-105'
                                    : 'bg-[#2a2a2a] text-[#ffffff20] cursor-not-allowed hidden'
                                    }`}
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={18} className="translate-x-0.5 translate-y-0.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setViewingImage(null)}
                >
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-sm"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={viewingImage || undefined}
                        alt="Full size"
                        className="max-w-full max-h-full rounded-lg shadow-2xl animate-scaleUp"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
