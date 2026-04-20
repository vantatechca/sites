"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, MessageCircle } from "lucide-react";

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderRole: "client" | "agency";
  createdAt: string;
  isAiGenerated?: boolean;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
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
  onAttachFile,
  isLoading = false,
  className,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    setIsSending(true);
    setInputValue("");

    try {
      await onSendMessage(content);
    } catch {
      setInputValue(content);
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

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col",
                          isClient ? "items-end" : "items-start"
                        )}
                      >
                        {showLabel && (
                          <span className="mb-1 text-[11px] font-medium text-gray-400">
                            {isClient ? "You" : "Your Team"}
                          </span>
                        )}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
                            isClient
                              ? "rounded-br-md bg-[var(--portal-primary,#4F46E5)] text-white"
                              : "rounded-bl-md bg-gray-100 text-gray-800"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
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
