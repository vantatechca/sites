"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageListSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Send,
  AlertTriangle,
  MessageSquare,
  Lock,
  Reply,
  Paperclip,
  Bold,
  Italic,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useMessages,
  useSendMessage,
  type MessageData,
} from "@/hooks/use-messages"
import type { ThreadType } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectMessagesProps {
  projectId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (msgDate.getTime() === today.getTime()) return "Today"
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday"
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function groupMessagesByDate(messages: MessageData[]) {
  const groups: { date: string; messages: MessageData[] }[] = []
  let currentDate = ""

  // Messages come in desc order from API, reverse for chronological display
  const sorted = [...messages].reverse()

  for (const msg of sorted) {
    const dateSep = getDateSeparator(msg.createdAt)
    if (dateSep !== currentDate) {
      currentDate = dateSep
      groups.push({ date: dateSep, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }

  return groups
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  onReply,
}: {
  message: MessageData
  onReply: (messageId: string) => void
}) {
  const isOptimistic = message.id.startsWith("optimistic_")
  const isClient = message.senderRole === "client"

  return (
    <div
      className={cn(
        "group flex gap-3",
        isOptimistic && "opacity-60"
      )}
    >
      <Avatar size="sm" className="mt-0.5 shrink-0">
        {message.senderAvatarUrl && (
          <AvatarImage
            src={message.senderAvatarUrl}
            alt={message.senderName ?? ""}
          />
        )}
        <AvatarFallback>
          {initials(message.senderName ?? "?")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1A1A2E]">
            {message.senderName ?? "Unknown"}
          </span>
          {isClient && (
            <span className="inline-flex items-center rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
              Client
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatTimestamp(message.createdAt)}
          </span>
        </div>

        <div className="mt-1 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {message.body}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border bg-gray-50 px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors"
              >
                <Paperclip className="h-3 w-3" />
                {att.name}
              </a>
            ))}
          </div>
        )}

        {/* Reply button */}
        <button
          onClick={() => onReply(message.id)}
          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Reply className="h-3 w-3" />
          Reply
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatPane
// ---------------------------------------------------------------------------

function ChatPane({
  projectId,
  threadType,
  isClientChat,
}: {
  projectId: string
  threadType: ThreadType
  isClientChat: boolean
}) {
  const {
    data: messagesData,
    isLoading,
    error,
  } = useMessages(projectId, threadType, { polling: true })
  const sendMessage = useSendMessage(projectId)

  const [draft, setDraft] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messagesData?.messages.length])

  const groups = useMemo(() => {
    if (!messagesData?.messages) return []
    return groupMessagesByDate(messagesData.messages)
  }, [messagesData?.messages])

  const handleSend = () => {
    const body = draft.trim()
    if (!body) return

    sendMessage.mutate({
      thread_type: threadType,
      body,
      parent_message_id: replyTo ?? undefined,
    })

    setDraft("")
    setReplyTo(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) return <MessageListSkeleton rows={6} />

  if (error) {
    return (
      <EmptyState
        title="Failed to load messages"
        description="There was an error loading the chat. Please try again."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {group.date}
                </span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onReply={setReplyTo}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3 space-y-2">
        {/* Client warning */}
        {isClientChat && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs font-medium text-red-700">
              CLIENT WILL SEE THIS - Messages posted here are visible to the
              client.
            </p>
          </div>
        )}

        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Reply className="h-3 w-3" />
            <span>Replying to message</span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled>
            <Link2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled>
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Input and send */}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isClientChat
                ? "Type a message to the client..."
                : "Type an internal message..."
            }
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ProjectMessages({ projectId }: ProjectMessagesProps) {
  return (
    <Tabs defaultValue={0}>
      <TabsList variant="line">
        <TabsTrigger value={0}>
          <Lock className="h-3.5 w-3.5 mr-1" />
          Internal Chat
        </TabsTrigger>
        <TabsTrigger value={1}>
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          Client Chat
        </TabsTrigger>
      </TabsList>

      <TabsContent value={0} className="mt-0">
        <div className="rounded-lg border bg-white">
          <ChatPane
            projectId={projectId}
            threadType="internal_chat"
            isClientChat={false}
          />
        </div>
      </TabsContent>

      <TabsContent value={1} className="mt-0">
        <div className="rounded-lg border bg-white">
          <ChatPane
            projectId={projectId}
            threadType="client_chat"
            isClientChat={true}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
