"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ThreadType } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageData {
  id: string
  projectId: string
  threadType: ThreadType
  parentMessageId: string | null
  senderId: string
  body: string
  attachments: Array<{ name: string; url: string; type: string; size?: number }> | null
  deliverableId: string | null
  isVisibleToClient: boolean
  isReadByClient: boolean
  createdAt: string
  senderName: string | null
  senderEmail: string | null
  senderRole: string | null
  senderAvatarUrl: string | null
}

export interface MessagesResponse {
  messages: MessageData[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SendMessagePayload {
  thread_type: ThreadType
  body: string
  parent_message_id?: string
  deliverable_id?: string
  attachments?: Array<{ name: string; url: string; type: string; size?: number }>
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const messageKeys = {
  all: (projectId: string) => ["messages", projectId] as const,
  list: (projectId: string, threadType?: string) =>
    [...messageKeys.all(projectId), threadType ?? "all"] as const,
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error")
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// useMessages – fetch messages with optional polling
// ---------------------------------------------------------------------------

export function useMessages(
  projectId: string,
  threadType?: ThreadType,
  options?: { polling?: boolean }
) {
  const params = new URLSearchParams()
  params.set("limit", "100")
  if (threadType) params.set("thread_type", threadType)

  return useQuery<MessagesResponse>({
    queryKey: messageKeys.list(projectId, threadType),
    queryFn: async () => {
      try {
        return await fetchJSON<MessagesResponse>(
          `/api/projects/${projectId}/messages?${params.toString()}`
        )
      } catch {
        // No mock fallback — return empty list shaped like MessagesResponse
        return { messages: [], total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    },
    enabled: !!projectId,
    staleTime: 5_000,
    refetchInterval: options?.polling ? 5_000 : false,
  })
}

// ---------------------------------------------------------------------------
// useSendMessage – mutation to send a message with optimistic update
// ---------------------------------------------------------------------------

export function useSendMessage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ message: MessageData }, Error, SendMessagePayload, { previousMessages?: MessagesResponse }>({
    mutationFn: async (payload) => {
      return fetchJSON(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onMutate: async (newMessage) => {
      const threadType = newMessage.thread_type
      const queryKey = messageKeys.list(projectId, threadType)

      await queryClient.cancelQueries({ queryKey })

      const previousMessages = queryClient.getQueryData<MessagesResponse>(queryKey)

      if (previousMessages) {
        const optimisticMessage: MessageData = {
          id: `optimistic_${Date.now()}`,
          projectId,
          threadType: newMessage.thread_type,
          parentMessageId: newMessage.parent_message_id ?? null,
          senderId: "current_user",
          body: newMessage.body,
          attachments: newMessage.attachments ?? null,
          deliverableId: newMessage.deliverable_id ?? null,
          isVisibleToClient: newMessage.thread_type === "client_chat",
          isReadByClient: false,
          createdAt: new Date().toISOString(),
          senderName: "You",
          senderEmail: null,
          senderRole: null,
          senderAvatarUrl: null,
        }

        queryClient.setQueryData<MessagesResponse>(queryKey, {
          ...previousMessages,
          messages: [optimisticMessage, ...previousMessages.messages],
          total: previousMessages.total + 1,
        })
      }

      return { previousMessages }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: messageKeys.list(projectId, variables.thread_type),
      })
      queryClient.invalidateQueries({
        queryKey: messageKeys.all(projectId),
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockMessages(threadType?: string): MessagesResponse {
  const now = new Date()
  const makeDate = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3600000).toISOString()

  const internalMessages: MessageData[] = [
    {
      id: "msg_1",
      projectId: "proj_1",
      threadType: "internal_chat",
      parentMessageId: null,
      senderId: "usr_1",
      body: "Just finished the requirements review. Client wants a very clean, minimalist look for the homepage. Sharing the notes doc now.",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: false,
      isReadByClient: false,
      createdAt: makeDate(48),
      senderName: "Alex Rivera",
      senderEmail: "alex@siteforge.dev",
      senderRole: "manager",
      senderAvatarUrl: null,
    },
    {
      id: "msg_2",
      projectId: "proj_1",
      threadType: "internal_chat",
      parentMessageId: null,
      senderId: "usr_4",
      body: "Got it. I'll start on the wireframes today. Should have something to show by tomorrow EOD.",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: false,
      isReadByClient: false,
      createdAt: makeDate(46),
      senderName: "Sam Chen",
      senderEmail: "sam@siteforge.dev",
      senderRole: "team_member",
      senderAvatarUrl: null,
    },
    {
      id: "msg_3",
      projectId: "proj_1",
      threadType: "internal_chat",
      parentMessageId: "msg_2",
      senderId: "usr_3",
      body: "Nice. I'll need the finalized designs before I can start on the theme. Let me know when they're approved.",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: false,
      isReadByClient: false,
      createdAt: makeDate(44),
      senderName: "Jamie Lopez",
      senderEmail: "jamie@siteforge.dev",
      senderRole: "team_member",
      senderAvatarUrl: null,
    },
    {
      id: "msg_4",
      projectId: "proj_1",
      threadType: "internal_chat",
      parentMessageId: null,
      senderId: "usr_1",
      body: "Heads up: payment gateway setup is blocked. Client hasn't sent Stripe credentials yet. I'm following up today.",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: false,
      isReadByClient: false,
      createdAt: makeDate(6),
      senderName: "Alex Rivera",
      senderEmail: "alex@siteforge.dev",
      senderRole: "manager",
      senderAvatarUrl: null,
    },
  ]

  const clientMessages: MessageData[] = [
    {
      id: "msg_c1",
      projectId: "proj_1",
      threadType: "client_chat",
      parentMessageId: null,
      senderId: "usr_1",
      body: "Hi Sarah! Welcome to your project portal. We're excited to start working on Artisan Candles. Feel free to ask any questions here.",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: true,
      isReadByClient: true,
      createdAt: makeDate(96),
      senderName: "Alex Rivera",
      senderEmail: "alex@siteforge.dev",
      senderRole: "manager",
      senderAvatarUrl: null,
    },
    {
      id: "msg_c2",
      projectId: "proj_1",
      threadType: "client_chat",
      parentMessageId: null,
      senderId: "usr_c1",
      body: "Thank you! Really looking forward to seeing the designs. Can we schedule a call this week to discuss the homepage layout?",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: true,
      isReadByClient: true,
      createdAt: makeDate(90),
      senderName: "Sarah Mitchell",
      senderEmail: "sarah@artisancandles.com",
      senderRole: "client",
      senderAvatarUrl: null,
    },
    {
      id: "msg_c3",
      projectId: "proj_1",
      threadType: "client_chat",
      parentMessageId: null,
      senderId: "usr_1",
      body: "Absolutely! I'll send you a calendar invite for Thursday at 2 PM. In the meantime, our designer has started on the wireframes.",
      attachments: null,
      deliverableId: null,
      isVisibleToClient: true,
      isReadByClient: true,
      createdAt: makeDate(88),
      senderName: "Alex Rivera",
      senderEmail: "alex@siteforge.dev",
      senderRole: "manager",
      senderAvatarUrl: null,
    },
  ]

  let messages: MessageData[] = []
  if (threadType === "internal_chat") {
    messages = internalMessages
  } else if (threadType === "client_chat") {
    messages = clientMessages
  } else {
    messages = [...internalMessages, ...clientMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  return {
    messages,
    total: messages.length,
    page: 1,
    limit: 100,
    totalPages: 1,
  }
}
