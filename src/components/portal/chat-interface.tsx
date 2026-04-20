"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, MessageCircle, Pencil, Trash2, Check, X, CornerUpLeft } from "lucide-react";

export interface ReplyReference {
  id: string;
  content: string;
  senderLabel: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderRole: "client" | "agency";
  createdAt: string;
  isAiGenerated?: boolean;
  replyTo?: ReplyReference;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string, replyTo?: ReplyReference) => Promise<void>;
  onEditMessage?: (id: string, newContent: string) => Promise<void> | void;
  onDeleteMessage?: (id: string) => Promise<void> | void;
  onAttachFile?: () => void;
  isLoading?: boolean;
  className?: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupMessagesByDate(
  messages: ChatMessage[]
): Map<string, ChatMessage[]> {
  const groups = new Map<string, ChatMessage[]>();
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  }
  return groups;
}

export function ChatInterface({
  messages,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onAttachFile,
  isLoading = false,
  className,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleStartReply = (msg: ChatMessage) => {
    const senderLabel = msg.senderId === currentUserId ? "You" : "Your Team";
    setReplyingTo({ id: msg.id, content: msg.content, senderLabel });
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditValue(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    const trimmed = editValue.trim();
    if (!editingId || !trimmed || !onEditMessage) {
      handleCancelEdit();
      return;
    }
    await onEditMessage(editingId, trimmed);
    handleCancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteMessage) return;
    await onDeleteMessage(id);
  };

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    const currentReply = replyingTo;
    setIsSending(true);
    setInputValue("");
    setReplyingTo(null);

    try {
      await onSendMessage(content, currentReply ?? undefined);
    } catch {
      setInputValue(content);
      setReplyingTo(currentReply);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const dateGroups = groupMessagesByDate(messages);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white",
        className
      )}
    >
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <MessageCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-600">
              Start the conversation
            </h3>
            <p className="mt-1 max-w-xs text-sm text-gray-400">
              Send a message to your team. They are here to help with anything
              you need.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(dateGroups.entries()).map(([dateKey, dayMessages]) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <span className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    {formatDateSeparator(dayMessages[0].createdAt)}
                  </span>
                </div>

                {/* Messages for this day */}
                <div className="space-y-3">
                  {dayMessages.map((msg, idx) => {
                    const isClient = msg.senderId === currentUserId;
                    const showLabel =
                      idx === 0 ||
                      dayMessages[idx - 1].senderRole !== msg.senderRole;

                    const isEditing = editingId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "group flex flex-col",
                          isClient ? "items-end" : "items-start"
                        )}
                      >
                        {showLabel && (
                          <span className="mb-1 text-[11px] font-medium text-gray-400">
                            {isClient ? "You" : "Your Team"}
                          </span>
                        )}
                        <div className={cn("flex items-center gap-2", isClient ? "flex-row" : "flex-row-reverse")}>
                          {!isEditing && (
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleStartReply(msg)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                aria-label="Reply to message"
                              >
                                <CornerUpLeft className="h-3 w-3" />
                              </button>
                              {isClient && onEditMessage && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                  aria-label="Edit message"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                              {isClient && onDeleteMessage && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(msg.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
                                  aria-label="Delete message"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
                              isClient
                                ? "rounded-br-md bg-[var(--portal-primary,#4F46E5)] text-white"
                                : "rounded-bl-md bg-gray-100 text-gray-800"
                            )}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <Textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEdit();
                                    }
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                  autoFocus
                                  className="min-h-[60px] resize-none border-white/30 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-white/50 focus-visible:ring-white/20"
                                />
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                                    aria-label="Cancel edit"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--portal-primary,#4F46E5)] hover:bg-white/90"
                                    aria-label="Save edit"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {msg.replyTo && (
                                  <div
                                    className={cn(
                                      "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-[11px]",
                                      isClient
                                        ? "border-white/50 bg-white/10 text-white/80"
                                        : "border-gray-400 bg-gray-200/50 text-gray-600"
                                    )}
                                  >
                                    <p className="font-semibold">
                                      {msg.replyTo.senderLabel}
                                    </p>
                                    <p className="line-clamp-2 opacity-80">
                                      {msg.replyTo.content}
                                    </p>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "mt-0.5 text-[10px] text-gray-400",
                            isClient ? "mr-1" : "ml-1"
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-3 sm:p-4">
        {replyingTo && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border-l-2 border-[var(--portal-primary,#4F46E5)] bg-white px-3 py-2 shadow-sm">
            <CornerUpLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--portal-primary,#4F46E5)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[var(--portal-primary,#4F46E5)]">
                Replying to {replyingTo.senderLabel}
              </p>
              <p className="line-clamp-1 text-[12px] text-gray-600">
                {replyingTo.content}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelReply}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cancel reply"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          {onAttachFile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAttachFile}
              className="shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Attach file"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </Button>
          )}

          <div className="relative flex-1">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-10 max-h-32 resize-none rounded-xl border-gray-200 bg-white py-2.5 pr-12 text-sm shadow-sm focus-visible:border-[var(--portal-primary,#4F46E5)] focus-visible:ring-[var(--portal-primary,#4F46E5)]/20"
              rows={1}
            />
            <Button
              size="icon-sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="absolute right-1.5 bottom-1.5 rounded-lg"
              style={{
                backgroundColor: inputValue.trim()
                  ? "var(--portal-primary, #4F46E5)"
                  : undefined,
              }}
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
