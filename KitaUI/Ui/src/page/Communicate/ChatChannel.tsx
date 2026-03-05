import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../../services/chatService';
import type { MessageDto, ChannelDto } from '../../types/api';
import { Gift, Sticker, Smile, Send, MoreHorizontal, Pencil, Trash2, X, Check, Image, Copy, ExternalLink, CornerUpLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatChannelProps {
    channel: ChannelDto;
    onMemberClick?: (event: React.MouseEvent, senderId: string, senderName: string, senderAvatar?: string) => void;
}

const getMessageDate = (msg: MessageDto): string => {
    return msg.sentAt || msg.createdAt || new Date().toISOString();
};

const TAKE = 30;
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Truncate reply content preview
const truncate = (text: string, max = 80) =>
    text.length > max ? text.substring(0, max) + '…' : text;

// Helper to parse content and render Giphy/Image links
const renderMessageContentFragment = (content: string, setViewingImage: (url: string) => void, onJoinClick: (code: string) => void) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return (
        <>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    // Check if it's a Giphy link
                    const giphyMatch = part.match(/giphy\.com\/gifs\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]+)/);
                    if (giphyMatch) {
                        const gifUrl = `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
                        return (
                            <div key={i} className="my-1 block">
                                <img
                                    src={gifUrl}
                                    alt="Giphy"
                                    className="max-w-[250px] max-h-[250px] w-auto h-auto object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity border border-white/5"
                                    onClick={(e) => { e.stopPropagation(); setViewingImage(gifUrl); }}
                                />
                            </div>
                        );
                    }

                    // Direct image link (gif/png/jpg)
                    const isDirectImage = part.match(/\.(gif|png|jpe?g|webp)(\?.*)?$/i);
                    if (isDirectImage) {
                        return (
                            <div key={i} className="my-1 block">
                                <img
                                    src={part}
                                    alt="Image"
                                    className="max-w-[250px] max-h-[250px] w-auto h-auto object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity border border-white/5"
                                    onClick={(e) => { e.stopPropagation(); setViewingImage(part); }}
                                />
                            </div>
                        );
                    }

                    // Server Invite Link
                    const joinMatch = part.match(/\/join\/([a-zA-Z0-9_-]+)/);
                    if (joinMatch) {
                        return (
                            <div key={i} className="my-2 p-3 bg-[#1a141a]/80 border border-white/10 rounded-xl max-w-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF8C00] to-[#FF4D00] rounded-lg flex items-center justify-center shadow-lg">
                                        <Users size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-[#a0a0a0] font-medium uppercase tracking-wider mb-0.5">Server Invite</p>
                                        <p className="text-sm text-white font-bold truncate">Join this server</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onJoinClick(joinMatch[1]); }}
                                        className="px-4 py-1.5 bg-[#FF8C00]/20 hover:bg-[#FF8C00]/30 text-[#FF8C00] font-semibold rounded-lg transition-colors whitespace-nowrap"
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Normal link
                    return (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#FF8C00] hover:underline" onClick={(e) => e.stopPropagation()}>
                            {part}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};

export default function ChatChannel({ channel, onMemberClick }: ChatChannelProps) {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [skip, setSkip] = useState(0);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [contextMenuId, setContextMenuId] = useState<string | null>(null);
    const [reactionPickerId, setReactionPickerId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const currentUserIdRef = useRef<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    // typing: userId -> username
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingSentRef = useRef<number>(0);
    // reply state
    const [replyingTo, setReplyingTo] = useState<MessageDto | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const [initialLoad, setInitialLoad] = useState(true);

    // Decode JWT once
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
                const uid = payload[nameIdentifierClaim] || payload.sub || payload.nameid;
                setCurrentUserId(uid);
                currentUserIdRef.current = uid;
            } catch (error) {
                console.error("Failed to parse JWT", error);
            }
        }
    }, []);

    useEffect(() => {
        setMessages([]);
        setSkip(0);
        setHasMore(true);
        setTypingUsers(new Map());
        setReplyingTo(null);
        typingTimeouts.current.forEach(t => clearTimeout(t));
        typingTimeouts.current.clear();
        lastTypingSentRef.current = 0;

        loadMessages(0, true);
        joinChannel();

        return () => {
            leaveChannel();
            // Clear only channel-specific callbacks, keep server-level callbacks
            chatService.clearChannelCallbacks();
        };
    }, [channel.id]);

    useEffect(() => {
        if (initialLoad && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            setInitialLoad(false);
        }
    }, [messages, initialLoad]);

    // Infinite scroll sentinel
    useEffect(() => {
        const sentinel = topSentinelRef.current;
        const container = scrollContainerRef.current;
        if (!sentinel || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMoreMessages();
                }
            },
            { root: container, threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isLoading, skip]);

    const joinChannel = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token && !chatService.isConnected()) {
                await chatService.connect(token);
            }
            if (chatService.isConnected()) {
                await chatService.joinChannel(channel.id);

                // clear any old channel-specific callbacks to avoid duplicated events
                // but keep server-level callbacks (like ServerLeft) intact
                chatService.clearChannelCallbacks();

                chatService.onMessageReceived((msg) => {
                    if (msg.channelId === channel.id) {
                        setMessages(prev => {
                            // double check to prevent local duplication occasionally caused by react strict mode
                            if (prev.some(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
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

                chatService.onUserTyping((userId, username, channelId) => {
                    // Use ref instead of state to avoid stale closure
                    if (channelId.toLowerCase() !== channel.id.toLowerCase() || userId.toLowerCase() === currentUserIdRef.current?.toLowerCase()) return;
                    setTypingUsers(prev => {
                        const next = new Map(prev);
                        next.set(userId, username);
                        return next;
                    });
                    if (typingTimeouts.current.has(userId)) {
                        clearTimeout(typingTimeouts.current.get(userId)!);
                    }
                    const t = setTimeout(() => {
                        setTypingUsers(prev => {
                            const next = new Map(prev);
                            next.delete(userId);
                            return next;
                        });
                        typingTimeouts.current.delete(userId);
                    }, 3500);
                    typingTimeouts.current.set(userId, t);
                });

                chatService.onStoppedTyping((userId: string, channelId: string) => {
                    if (channelId.toLowerCase() !== channel.id.toLowerCase()) return;
                    setTypingUsers(prev => {
                        const next = new Map(prev);
                        next.delete(userId);
                        return next;
                    });
                    if (typingTimeouts.current.has(userId)) {
                        clearTimeout(typingTimeouts.current.get(userId)!);
                        typingTimeouts.current.delete(userId);
                    }
                });

                chatService.onMessageReactionChanged((msg) => {
                    if (msg.channelId === channel.id) {
                        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const leaveChannel = async () => {
        if (chatService.isConnected()) {
            await chatService.leaveChannel(channel.id);
            await chatService.stopTyping(channel.id);
        }
    };

    const loadMessages = async (skipVal: number, isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const msgs = await chatService.fetchChannelMessages(channel.id, TAKE, skipVal);
            const sorted = msgs.sort((a, b) =>
                new Date(getMessageDate(a)).getTime() - new Date(getMessageDate(b)).getTime()
            );
            // Ensure no duplicate IDs in the loaded messages
            const uniqueMessages = Array.from(new Map(sorted.map(m => [m.id, m])).values());
            setMessages(uniqueMessages);
            setSkip(uniqueMessages.length);
            setHasMore(uniqueMessages.length >= TAKE);
            if (isInitial) setInitialLoad(true);
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreMessages = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight || 0;
        try {
            const older = await chatService.fetchChannelMessages(channel.id, TAKE, skip);
            const sorted = older.sort((a, b) =>
                new Date(getMessageDate(a)).getTime() - new Date(getMessageDate(b)).getTime()
            );
            if (sorted.length === 0) {
                setHasMore(false);
            } else {
                setMessages(prev => {
                    // Filter out any duplicates before prepending
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMessages = sorted.filter(m => !existingIds.has(m.id));
                    return [...newMessages, ...prev];
                });
                setSkip(s => s + sorted.length);
                setHasMore(sorted.length >= TAKE);
                requestAnimationFrame(() => {
                    const container = scrollContainerRef.current;
                    if (container) {
                        container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
                    }
                });
            }
        } catch (error) {
            console.error("Failed to load more messages", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [channel.id, skip, hasMore, isLoadingMore]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        const now = Date.now();
        const THROTTLE_MS = 300;
        const STOP_DELAY_MS = 1500;

        // Throttle: chỉ gửi startTyping nếu đã qua 300ms từ lần gửi trước
        if (now - lastTypingSentRef.current > THROTTLE_MS) {
            chatService.startTyping(channel.id);
            lastTypingSentRef.current = now;
        }

        // Debounce: reset timer mỗi lần gõ, chỉ gửi stopTyping sau 1.5s dừng
        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = setTimeout(() => {
            chatService.stopTyping(channel.id);
            lastTypingSentRef.current = 0;
        }, STOP_DELAY_MS);
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
        chatService.stopTyping(channel.id);
        lastTypingSentRef.current = 0;

        const reply = replyingTo;
        setReplyingTo(null);

        try {
            await chatService.sendMessage(
                channel.id,
                newMessage,
                reply?.id,
                reply ? truncate(reply.content || (reply.imageUrl ? '[Image]' : ''), 120) : undefined,
                reply ? (reply.senderName || reply.username) : undefined
            );
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

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData.items;
        const pastedFiles: File[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    pastedFiles.push(file);
                }
            }
        }

        if (pastedFiles.length > 0) {
            setSelectedImages(prev => [...prev, ...pastedFiles]);
            const newPreviews = pastedFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
            e.preventDefault();
        }
    };

    const cancelImageUpload = () => {
        setSelectedImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const sendImageMessage = async () => {
        if (selectedImages.length === 0) return;
        setIsUploading(true);
        try {
            const uploadPromises = selectedImages.map((file, index) => {
                const caption = index === 0 ? newMessage : undefined;
                return chatService.sendImageMessage(channel.id, file, caption);
            });
            await Promise.all(uploadPromises);
            cancelImageUpload();
            setNewMessage('');
            setReplyingTo(null);
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
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error("Failed to edit message", error);
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            await chatService.deleteMessage(channel.id, messageId);
            setContextMenuId(null);
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const startReply = (msg: MessageDto) => {
        setReplyingTo(msg);
        setContextMenuId(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!currentUserId) return;
        setReactionPickerId(null);
        try {
            await chatService.toggleReaction(messageId, channel.id, emoji);
        } catch (error) {
            console.error("Failed to toggle reaction", error);
        }
    };

    const getSenderName = (msg: MessageDto): string => {
        return msg.senderName || msg.username || 'Unknown';
    };

    const getTypingText = (): string | null => {
        const entries = Array.from(typingUsers.entries());
        if (entries.length === 0) return null;
        const names = entries.map(([, name]) => name);
        if (names.length === 1) return `${names[0]} đang nhập`;
        if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập`;
        if (names.length === 3) return `${names[0]}, ${names[1]} và ${names[2]} đang nhập`;
        return `${names[0]}, ${names[1]} và ${names.length - 2} người khác đang nhập`;
    };

    const typingText = getTypingText();

    return (
        <div
            className="flex flex-col h-full bg-white relative"
            onClick={() => { setContextMenuId(null); setReactionPickerId(null); }}
        >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Channel header */}
            <div className="h-14 px-6 flex items-center border-b-4 border-black bg-gray-50 z-10 sticky top-0 uppercase tracking-tighter">
                <span className="text-2xl text-black mr-2 font-black">#</span>
                <h3 className="text-black font-black text-xl">{channel.name}</h3>
            </div>

            {/* Message list */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar relative z-0">
                <div ref={topSentinelRef} className="h-1" />

                {isLoadingMore && (
                    <div className="flex items-center justify-center py-3">
                        <div className="w-5 h-5 rounded-full border-2 border-[#FF8C00] border-t-transparent animate-spin" />
                        <span className="text-xs text-[#a0a0a0] ml-2">Loading older messages…</span>
                    </div>
                )}

                {!hasMore && messages.length > 0 && (
                    <div className="text-center py-3">
                        <p className="text-xs text-[#a0a0a0]/50">Beginning of #{channel.name}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-10 h-10 rounded-full border-2 border-[#FF8C00] border-t-transparent animate-spin ring-4 ring-[#FF8C00]/10" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="mt-10 mb-6 text-center z-10 relative">
                        <div className="w-20 h-20 bg-gray-100 border-4 border-black flex items-center justify-center mx-auto mb-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-5xl text-black font-black">#</span>
                        </div>
                        <h1 className="text-black text-3xl font-black mb-2 uppercase tracking-tighter">Welcome to #{channel.name}</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">This is the start of the #{channel.name} channel.</p>
                    </div>
                ) : (
                    <div className="flex flex-col pb-2">
                        {messages.map((msg, idx) => {
                            const prevMsg = messages[idx - 1];
                            const msgDate = getMessageDate(msg);
                            const prevMsgDate = prevMsg ? getMessageDate(prevMsg) : '';
                            const showHeader = idx === 0 ||
                                prevMsg?.senderId !== msg.senderId ||
                                (new Date(msgDate).getTime() - new Date(prevMsgDate).getTime() > 300000);

                            const isOwner = msg.senderId === currentUserId;
                            const isEditing = editingMessageId === msg.id;

                            const msgReactions = new Map<string, Set<string>>();
                            msg.reactions?.forEach(r => {
                                if (!msgReactions.has(r.emoji)) msgReactions.set(r.emoji, new Set());
                                msgReactions.get(r.emoji)!.add(r.userId);
                            });
                            const hasReactions = msgReactions.size > 0;

                            const hasReply = !!msg.replyToId && !!msg.replyToSenderName;

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`group flex gap-3 relative flex-row hover:bg-white/[0.02] px-1 rounded-md transition-colors ${showHeader ? 'mt-3 pt-1' : 'mt-0.5'}`}
                                >
                                    {/* Avatar */}
                                    {showHeader ? (
                                        <button
                                            onClick={(e) => onMemberClick?.(e, msg.senderId, getSenderName(msg), msg.senderAvatarUrl)}
                                            className="w-10 h-10 rounded-none flex-shrink-0 flex items-center justify-center bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] overflow-hidden transition-all mt-0.5"
                                        >
                                            {msg.senderAvatarUrl ? (
                                                <img src={msg.senderAvatarUrl} alt="" className="w-full h-full object-cover transition-all" />
                                            ) : (
                                                <div className="w-full h-full bg-white flex items-center justify-center text-black font-black text-[10px] uppercase">
                                                    {getSenderName(msg).substring(0, 2)}
                                                </div>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-10 flex-shrink-0" />
                                    )}

                                    {/* Content */}
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        {showHeader && (
                                            <div className="flex items-baseline gap-2 mb-0.5">
                                                <button
                                                    onClick={(e) => onMemberClick?.(e, msg.senderId, getSenderName(msg), msg.senderAvatarUrl)}
                                                    className="text-black font-black text-sm hover:underline cursor-pointer uppercase tracking-tight"
                                                >
                                                    {getSenderName(msg)}
                                                </button>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {new Date(msgDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}

                                        {/* Reply quote block */}
                                        {hasReply && !isEditing && (
                                            <div className="flex items-center gap-2 mb-1 ml-1 cursor-pointer group/reply"
                                                onClick={() => {
                                                    const el = document.getElementById(`msg-${msg.replyToId}`);
                                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    el?.classList.add('bg-[#FF8C00]/10');
                                                    setTimeout(() => el?.classList.remove('bg-[#FF8C00]/10'), 1500);
                                                }}
                                            >
                                                <div className="w-0.5 h-full min-h-[14px] bg-[#a0a0a0]/40 rounded-full flex-shrink-0" />
                                                <span className="text-[11px] text-[#a0a0a0] group-hover/reply:text-white/70 transition-colors truncate max-w-[400px]">
                                                    <span className="font-semibold text-white/60">{msg.replyToSenderName}: </span>
                                                    {truncate(msg.replyToContent || '[Image]', 80)}
                                                </span>
                                            </div>
                                        )}

                                        {isEditing ? (
                                            <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#FF8C00]/50 w-full shadow-[0_0_15px_rgba(255,140,0,0.1)]">
                                                <input
                                                    type="text"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEdit(msg.id);
                                                        if (e.key === 'Escape') cancelEditing();
                                                    }}
                                                    className="w-full bg-transparent text-white outline-none text-[14px]"
                                                    autoFocus
                                                />
                                                <div className="flex items-center gap-2 mt-2 text-xs justify-end">
                                                    <button onClick={() => saveEdit(msg.id)} className="flex items-center gap-1 text-[#FF8C00] hover:text-[#FF4D00] font-medium px-2 py-1 rounded hover:bg-[#FF8C00]/10">
                                                        <Check size={12} /> Save
                                                    </button>
                                                    <button onClick={cancelEditing} className="flex items-center gap-1 text-[#a0a0a0] hover:text-white px-2 py-1 rounded hover:bg-white/5">
                                                        <X size={12} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div id={`msg-${msg.id}`} className="relative w-full min-w-0 rounded-md transition-colors duration-700">
                                                {msg.imageUrl && (
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Sent image"
                                                        className="max-w-[350px] max-h-[350px] w-auto h-auto object-contain rounded-lg mb-1 cursor-pointer hover:opacity-95 transition-opacity border border-white/5"
                                                        onClick={() => setViewingImage(msg.imageUrl || null)}
                                                    />
                                                )}
                                                {msg.content && (
                                                    <div className="text-[14px] leading-relaxed text-black font-medium whitespace-pre-wrap break-words break-all pr-1">
                                                        {renderMessageContentFragment(msg.content, setViewingImage, (code) => navigate(`/join/${code}`))}
                                                        {msg.isEdited && (
                                                            <span className="text-[10px] text-gray-500 ml-1 italic font-bold uppercase">(edited)</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Reaction pills */}
                                                {hasReactions && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Array.from(msgReactions!.entries()).map(([emoji, users]) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }}
                                                                className={`flex items-center gap-1 px-2 py-0.5 rounded-none text-xs border-2 transition-all duration-300 hover:scale-110 active:scale-95 animate-in fade-in zoom-in-50 duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${currentUserId && users.has(currentUserId)
                                                                    ? 'bg-black border-black text-white'
                                                                    : 'bg-white border-black text-black hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                <span>{emoji}</span>
                                                                <span className="font-bold">{users.size}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover action buttons */}
                                    {!isEditing && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 relative flex-shrink-0 self-start mt-0.5">
                                            {/* Reply button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startReply(msg); }}
                                                className="p-1.5 bg-white border-2 border-black rounded-none text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                                title="Reply"
                                            >
                                                <CornerUpLeft size={13} strokeWidth={3} />
                                            </button>

                                            {/* Reaction picker */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReactionPickerId(reactionPickerId === msg.id ? null : msg.id);
                                                        setContextMenuId(null);
                                                    }}
                                                    className="p-1.5 bg-white border-2 border-black rounded-none text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                                    title="React"
                                                >
                                                    <Smile size={13} strokeWidth={3} />
                                                </button>

                                                {reactionPickerId === msg.id && (
                                                    <div
                                                        className="absolute bottom-full mb-2 right-0 bg-white border-4 border-black p-2 flex gap-1.5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 rounded-none"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {REACTION_EMOJIS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => toggleReaction(msg.id, emoji)}
                                                                className="text-lg hover:scale-125 transition-transform leading-none"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* More options */}
                                            {(isOwner || msg.imageUrl) && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setContextMenuId(contextMenuId === msg.id ? null : msg.id);
                                                            setReactionPickerId(null);
                                                        }}
                                                        className="p-1.5 bg-white border-2 border-black rounded-none text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                                    >
                                                        <MoreHorizontal size={13} strokeWidth={3} />
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
                                                                        onClick={() => { navigator.clipboard.writeText(msg.imageUrl!); setContextMenuId(null); }}
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
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Typing indicator */}
            <div className="px-6 min-h-[22px] flex items-center relative z-10">
                {typingText && (
                    <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0]">
                        <div className="flex gap-0.5 items-end pb-0.5">
                            <span className="w-1.5 h-1.5 bg-[#FF8C00]/70 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '900ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#FF8C00]/70 rounded-full animate-bounce" style={{ animationDelay: '180ms', animationDuration: '900ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#FF8C00]/70 rounded-full animate-bounce" style={{ animationDelay: '360ms', animationDuration: '900ms' }} />
                        </div>
                        <span className="italic text-[#a0a0a0]">
                            <span className="font-medium text-white">{typingText}</span>…
                        </span>
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="px-6 pb-4 pt-0 relative z-20">
                {/* Image previews */}
                {imagePreviews.length > 0 && (
                    <div className="mb-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative inline-block flex-shrink-0">
                                <img src={preview} alt={`Preview ${index}`} className="h-36 w-auto rounded-xl border border-[#FF8C00]/30 shadow-lg object-cover" />
                                <button onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reply preview bar */}
                {replyingTo && (
                    <div className="mb-2 flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm">
                        <CornerUpLeft size={14} className="text-[#FF8C00] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-[#FF8C00] mr-1">{getSenderName(replyingTo)}</span>
                            <span className="text-white/50 truncate">
                                {truncate(replyingTo.content || (replyingTo.imageUrl ? '[Image]' : ''), 100)}
                            </span>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="text-[#a0a0a0] hover:text-white transition-colors flex-shrink-0"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-white rounded-none p-2 pl-4 flex items-center gap-3 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all focus-within:translate-x-1 focus-within:translate-y-1 focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="text-black hover:bg-black hover:text-white transition-colors p-2 rounded-none border-2 border-transparent hover:border-black" title="Upload Image">
                            <Image size={20} strokeWidth={3} />
                        </button>

                        <div className="w-1 h-6 bg-black" />

                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={
                                replyingTo
                                    ? `REPLY TO ${getSenderName(replyingTo)}…`
                                    : selectedImages.length > 0
                                        ? 'CAPTION IMAGE…'
                                        : `TRANSMIT TO #${channel.name}`
                            }
                            value={newMessage}
                            onChange={handleInputChange}
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    selectedImages.length > 0 ? sendImageMessage() : sendMessage();
                                }
                                if (e.key === 'Escape' && replyingTo) {
                                    setReplyingTo(null);
                                }
                            }}
                            className="flex-1 bg-transparent text-black font-bold uppercase tracking-widest placeholder:text-gray-400 outline-none text-[15px] placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                        />

                        <div className="flex items-center gap-1 pr-1">
                            <button className="text-black hover:bg-black hover:text-white transition-colors p-2 rounded-none border-2 border-transparent hover:border-black">
                                <Gift size={20} strokeWidth={3} />
                            </button>
                            <button className="text-black hover:bg-black hover:text-white transition-colors p-2 rounded-none border-2 border-transparent hover:border-black">
                                <Sticker size={20} strokeWidth={3} />
                            </button>

                            <button
                                onClick={selectedImages.length > 0 ? sendImageMessage : sendMessage}
                                disabled={(!newMessage.trim() && selectedImages.length === 0) || isUploading}
                                className={`ml-2 w-10 h-10 rounded-none flex items-center justify-center transition-all duration-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${(newMessage.trim() || selectedImages.length > 0) && !isUploading
                                    ? 'bg-black text-white hover:bg-white hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed hidden'
                                    }`}
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={18} strokeWidth={3} className="translate-x-0.5 translate-y-0.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-screen image viewer */}
            {viewingImage && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
                    <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-sm">
                        <X size={24} />
                    </button>
                    <img src={viewingImage || undefined} alt="Full size" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
