"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChatInterface,
  type ChatMessage,
  type ReplyReference,
} from "@/components/portal/chat-interface";
import { cn } from "@/lib/utils";
import { Hash, Palette, Code, Receipt } from "lucide-react";

interface ThreadInfo {
  id: string;
  name: string;
  icon: typeof Hash;
  description: string;
}

interface ThreadedMessage extends ChatMessage {
  threadId: string;
}

const THREADS: ThreadInfo[] = [
  { id: "general", name: "General", icon: Hash, description: "Project updates" },
  { id: "design", name: "Design", icon: Palette, description: "Design feedback" },
  { id: "development", name: "Development", icon: Code, description: "Dev questions" },
  { id: "invoices", name: "Billing", icon: Receipt, description: "Invoice questions" },
];

export default function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [messages, setMessages] = useState<ThreadedMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("general");

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`);
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      const list: ThreadedMessage[] = Array.isArray(data) ? data : data.messages || [];
      setMessages(list);
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
    } catch {
      setCurrentUserId((prev) => prev || "demo-client");
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: "msg_1",
            threadId: "general",
            content: "Hi! Welcome to your project. We're excited to get started on your new Shopify store.",
            senderId: "usr_1",
            senderRole: "agency" as const,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
          {
            id: "msg_2",
            threadId: "general",
            content: "Thanks so much! I've been looking forward to this.",
            senderId: "demo-client",
            senderRole: "client" as const,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
          {
            id: "msg_3",
            threadId: "design",
            content: "We've drafted the homepage mockup. What do you think of the hero section?",
            senderId: "usr_1",
            senderRole: "agency" as const,
            createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
          },
          {
            id: "msg_4",
            threadId: "design",
            content: "Love it! Can we try a darker blue for the CTA button?",
            senderId: "demo-client",
            senderRole: "client" as const,
            createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          },
          {
            id: "msg_5",
            threadId: "development",
            content: "The theme is set up. We'll start building product pages tomorrow.",
            senderId: "usr_1",
            senderRole: "agency" as const,
            createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
          },
          {
            id: "msg_6",
            threadId: "invoices",
            content: "Invoice #INV-2024-002 has been sent for the design phase.",
            senderId: "usr_1",
            senderRole: "agency" as const,
            createdAt: new Date(Date.now() - 0.2 * 86400000).toISOString(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const threadMessages = useMemo(
    () => messages.filter((m) => m.threadId === selectedThreadId),
    [messages, selectedThreadId]
  );

  const threadStats = useMemo(() => {
    const stats: Record<string, { lastAt: string | null; count: number }> = {};
    for (const thread of THREADS) {
      const threadMsgs = messages.filter((m) => m.threadId === thread.id);
      const last = threadMsgs[threadMsgs.length - 1];
      stats[thread.id] = {
        lastAt: last?.createdAt || null,
        count: threadMsgs.length,
      };
    }
    return stats;
  }, [messages]);

  const handleSendMessage = async (content: string, replyTo?: ReplyReference) => {
    const optimisticMsg: ThreadedMessage = {
      id: `temp-${Date.now()}`,
      threadId: selectedThreadId,
      content,
      senderId: currentUserId || "demo-client",
      senderRole: "client",
      createdAt: new Date().toISOString(),
      replyTo,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          threadType: selectedThreadId,
          replyToId: replyTo?.id,
        }),
      });
    } catch {
      // Keep optimistic message in demo mode
    }
  };

  const handleEditMessage = async (id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: newContent } : m))
    );
    try {
      await fetch(`/api/projects/${projectId}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
    } catch {
      // Keep optimistic edit
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch(`/api/projects/${projectId}/messages/${id}`, {
        method: "DELETE",
      });
    } catch {
      // Keep optimistic delete
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  const selectedThread = THREADS.find((t) => t.id === selectedThreadId);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col space-y-6">
      <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chat with your team directly. We typically respond within a few hours.
        </p>
      </div>

      <div className="min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
        <div className="flex h-full gap-4">
          {/* Sidebar: Thread List */}
          <aside className="hidden w-64 shrink-0 overflow-y-auto rounded-xl border border-gray-100 bg-white p-2 md:block">
            <div className="px-2 py-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Conversations
              </h2>
            </div>
            <nav className="space-y-0.5">
              {THREADS.map((thread) => {
                const Icon = thread.icon;
                const isSelected = thread.id === selectedThreadId;
                const stats = threadStats[thread.id];
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-[var(--portal-primary,#4F46E5)]/10 text-[var(--portal-primary,#4F46E5)]"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{thread.name}</p>
                        {stats.count > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {stats.count}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-gray-500">
                        {thread.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main chat area */}
          <div className="min-w-0 flex-1">
            <div className="flex h-full flex-col">
              {selectedThread && (
                <div className="mb-2 flex shrink-0 items-center gap-2 rounded-t-xl border-x border-t border-gray-100 bg-white px-4 py-3 md:mb-0">
                  <selectedThread.icon className="h-4 w-4 text-[var(--portal-primary,#4F46E5)]" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedThread.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {selectedThread.description}
                    </p>
                  </div>
                </div>
              )}
              <div className="min-h-0 flex-1">
                <ChatInterface
                  messages={threadMessages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  className="h-full rounded-t-none border-t-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
