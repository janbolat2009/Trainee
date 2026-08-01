import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Conversation, DirectMessage } from '../../types';
import {
  fetchUserConversations,
  fetchConversationMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToConversationMessages,
  unsubscribeChatChannel,
} from '../../services/chatService';
import { MessageSquare, X, Send, User, Check, CheckCheck, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const ChatDrawer: React.FC = () => {
  const { isChatOpen, setIsChatOpen, currentProfile, totalUnreadChatCount, setTotalUnreadChatCount } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const previousMessageCountRef = useRef(0);

  const currentProfileId = currentProfile?.profile.id;

  const scrollToBottom = (force = false) => {
    const container = messageListRef.current;
    const target = messagesEndRef.current;
    if (!container || !target) return;

    if (force || previousMessageCountRef.current !== messages.length) {
      previousMessageCountRef.current = messages.length;
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'end' });
        container.scrollTop = container.scrollHeight;
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  // Lock background scroll on mobile while the drawer is open, so the page
  // behind it can't be dragged and the modal is the only scrollable surface.
  useEffect(() => {
    if (!isChatOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isChatOpen]);

  // Load conversations when chat drawer opens
  useEffect(() => {
    if (!isChatOpen || !currentProfileId) return;

    const loadConversations = async () => {
      setIsLoadingConvs(true);
      const convs = await fetchUserConversations(currentProfileId);
      setConversations(convs);
      setIsLoadingConvs(false);

      const unreadTotal = convs.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0);
      setTotalUnreadChatCount(unreadTotal);

      // Auto-select first conversation if available & none selected
      if (convs.length > 0 && !activeConversation) {
        setActiveConversation(convs[0]);
      }
    };

    void loadConversations();
  }, [isChatOpen, currentProfileId]);

  // Load messages & subscribe to Realtime when active conversation changes
  useEffect(() => {
    if (!activeConversation || !currentProfileId) return;

    // Unsubscribe from previous channel
    if (realtimeChannelRef.current) {
      unsubscribeChatChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const loadMessagesAndSubscribe = async () => {
      setIsLoadingMsgs(true);
      const msgs = await fetchConversationMessages(activeConversation.id);
      setMessages(msgs);
      setIsLoadingMsgs(false);
      requestAnimationFrame(() => scrollToBottom(true));

      // Mark messages as read
      await markMessagesAsRead(activeConversation.id, currentProfileId);

      // Update unread count in local state
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
      );

      // Subscribe to Realtime messages for this active chat
      const channel = subscribeToConversationMessages(activeConversation.id, (newMsg) => {
        setMessages((prevMsgs) => {
          if (prevMsgs.some((m) => m.id === newMsg.id)) return prevMsgs;
          return [...prevMsgs, newMsg];
        });

        // Automatically mark as read if active conversation is open
        void markMessagesAsRead(activeConversation.id, currentProfileId);
      });

      realtimeChannelRef.current = channel;
    };

    void loadMessagesAndSubscribe();

    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeChatChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [activeConversation?.id, currentProfileId]);

  if (!isChatOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation || !currentProfileId || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    const sent = await sendMessage(activeConversation.id, currentProfileId, text);
    if (sent) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      requestAnimationFrame(() => scrollToBottom(true));

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessage: sent, updatedAt: new Date().toISOString() }
            : c
        )
      );
    }

    setIsSending(false);
  };

  return (
    // FIX: no outer padding / no forced scroll wrapper on mobile — those pushed
    // the card taller than the real viewport and hid the header/close button.
    // Padding + centering scroll wrapper now only apply from `sm:` up.
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:overflow-y-auto sm:overscroll-contain sm:p-6 sm:py-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        // FIX: `100dvh` instead of `92vh` on mobile — `dvh` accounts for the
        // browser's address bar / safe areas so the card always matches the
        // real visible viewport instead of overflowing it.
        // FIX: full-bleed (no border/radius) on mobile so nothing gets clipped;
        // rounded card only reappears from `sm:` up.
        className="w-full h-[100dvh] sm:h-[620px] max-w-4xl sm:max-h-[85vh] bg-brand-card border-0 sm:border sm:border-brand-border rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Conversations Sidebar */}
        <div
          className={`w-full md:w-80 border-r border-brand-border/60 bg-brand-dark/95 flex flex-col min-h-0 ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-brand-border/60 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-white text-sm">Messages & Support</div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-brand-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation List */}
          {/* FIX: min-h-0 lets this flex child actually shrink so its own
              overflow-y-auto can kick in, instead of growing to fit content
              and pushing the header/footer off-screen. */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 pb-3">
            {isLoadingConvs ? (
              <div className="p-4 text-center text-xs text-brand-muted space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-accent" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-brand-muted space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                <p>No conversations yet.</p>
                <p className="text-[11px] text-zinc-500">Apply to a listing or contact a coach to start chatting.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const other = conv.otherUser;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-3 rounded-2xl flex items-center space-x-3 text-left transition ${
                      isSelected
                        ? 'bg-brand-elevated border border-brand-accent/40 shadow-glow-accent'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {other?.avatar ? (
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-10 h-10 rounded-xl object-cover border border-brand-border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand-black border border-brand-border flex items-center justify-center text-zinc-400 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">{other?.name ?? 'User'}</span>
                        {conv.lastMessage && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-brand-muted truncate">
                          {conv.lastMessage ? conv.lastMessage.text : 'Start conversation...'}
                        </p>
                        {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-accent text-black font-extrabold text-[9px]">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Thread View */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-brand-black/90 ${
            !activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 bg-brand-dark/80 border-b border-brand-border/60 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1 rounded-lg text-brand-muted hover:text-white shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {activeConversation.otherUser?.avatar ? (
                    <img
                      src={activeConversation.otherUser.avatar}
                      alt={activeConversation.otherUser.name}
                      className="w-9 h-9 rounded-xl object-cover border border-brand-border shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-brand-elevated border border-brand-border flex items-center justify-center text-zinc-300 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                      <span className="truncate">{activeConversation.otherUser?.name ?? 'Chat'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    </div>
                    <span className="text-[10px] text-brand-muted font-mono uppercase">
                      {activeConversation.otherUser?.role ?? 'User'} • REALTIME ACTIVE
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatOpen(false)}
                  className="shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message History */}
              {/* FIX: min-h-0 here is the key fix for "doesn't scroll on mobile" —
                  without it this panel could grow past the visible viewport
                  instead of scrolling internally. */}
              <div
                ref={messageListRef}
                className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto overscroll-contain space-y-3 pb-4"
              >
                {isLoadingMsgs ? (
                  <div className="h-full flex items-center justify-center text-xs text-brand-muted space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-brand-muted space-y-2">
                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                    <p>No messages yet. Send a greeting to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentProfileId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                            isMine
                              ? 'bg-white text-black font-medium rounded-br-none shadow-sm'
                              : 'bg-brand-card border border-brand-border text-zinc-200 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center space-x-1 mt-1 px-1 text-[9px] font-mono text-zinc-500">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-brand-accent inline" />
                              ) : (
                                <Check className="w-3 h-3 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-brand-dark/90 border-t border-brand-border/60 flex items-center gap-2 sticky bottom-0 shrink-0"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 min-w-0 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-accent"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="shrink-0 p-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted space-y-3">
              <MessageSquare className="w-12 h-12 text-zinc-700" />
              <h3 className="text-sm font-bold text-white">Select a conversation</h3>
              <p className="text-xs max-w-xs">
                Choose a conversation from the left to start sending real-time messages.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};