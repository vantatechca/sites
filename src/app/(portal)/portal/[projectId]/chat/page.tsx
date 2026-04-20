"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChatInterface,
  type ChatMessage,
} from "@/components/portal/chat-interface";

export default function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/messages?thread_type=client_chat`
      );
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      const list: ChatMessage[] = Array.isArray(data)
        ? data
        : data.messages || [];
      setMessages(list);
      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
      }
    } catch {
      // Demo mode: seed with mock messages ONLY if state is still empty
      setCurrentUserId((prev) => prev || "demo-client");
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: "msg_1",
            content: "Hi! Welcome to your project. We're excited to get started on your new Shopify store.",
            senderId: "usr_1",
            senderRole: "agency" as const,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
          {
            id: "msg_2",
            content: "Thanks so much! I've been looking forward to this. Can you share the initial design concepts when they're ready?",
            senderId: "demo-client",
            senderRole: "client" as const,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
          {
            id: "msg_3",
            content: "Absolutely! We're working on the homepage mockup right now. I'll share the first draft by end of this week.",
            senderId: "usr_1",
            senderRole: "agency" as const,
            createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 10 seconds
    pollRef.current = setInterval(fetchMessages, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  const handleSendMessage = async (content: string) => {
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId || "demo-client",
      senderRole: "client",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          threadType: "client_chat",
        }),
      });

      if (res.ok) {
        await fetchMessages();
      }
      // In demo mode or when API fails, keep the optimistic message
    } catch {
      // Network error — keep the optimistic message so the user sees it sent
    }
  };

  const handleAttachFile = () => {
    // Create a hidden file input and trigger it
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("threadType", "client_chat");

      try {
        const res = await fetch(
          `/api/projects/${projectId}/messages/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (res.ok) {
          await fetchMessages();
        }
      } catch {
        // Upload failed
      }
    };
    input.click();
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

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col space-y-6">
      {/* Header */}
      <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Messages
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Chat with your team directly. We typically respond within a few hours.
        </p>
      </div>

      {/* Chat interface fills remaining space */}
      <div className="min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
        <ChatInterface
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onAttachFile={handleAttachFile}
          isLoading={isTyping}
          className="h-full"
        />
      </div>
    </div>
  );
}
