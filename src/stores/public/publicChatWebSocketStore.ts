import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import { MessageType } from '../../types/kneoBroadcasterTypes'
import { apiServer } from '../../api/apiClient'

export interface ChatMessage {
  id: string
  username: string
  content: string
  timestamp: number
  type: MessageType
}

interface ChatEvent {
  type: 'MESSAGE' | 'message' | 'history' | 'error' | 'CHUNK' | 'PROCESSING'
  data?: ChatMessage
  messages?: ChatMessage[]
  message?: string
  content?: string
  username?: string
  connectionId?: string
  timestamp?: number
}

export const usePublicChatWebSocketStore = defineStore('publicChatWebSocketStore', () => {
  const chatWebsocket = ref<WebSocket | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isConnected = ref(false)
  const isSending = ref(false)
  const lastError = ref<string | null>(null)
  const streamingMessage = ref<string>('')
  const streamingUsername = ref<string | undefined>(undefined)
  const isStreaming = ref(false)
  const shouldReconnect = ref(true)

  const buildWebSocketUrl = (userToken: string): string => {
    // Use backend host from apiServer and per-user token from registration flow
    const httpUrl = new URL(apiServer)
    const wsProtocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${httpUrl.host}/api/ws/public-chat`
    return `${wsUrl}?token=${encodeURIComponent(userToken)}`
  }

  const isWebSocketActive = (ws: WebSocket | null | undefined): boolean => {
    return (
      ws !== null &&
      ws !== undefined &&
      (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
    )
  }

  const connect = (userToken: string) => {
    if (isWebSocketActive(chatWebsocket.value)) return

    shouldReconnect.value = true

    chatWebsocket.value = new WebSocket(buildWebSocketUrl(userToken))

    chatWebsocket.value.onopen = () => {
      console.log('Public chat WebSocket opened')
      isConnected.value = true
      lastError.value = null
      getHistory()
    }

    chatWebsocket.value.onmessage = (event: MessageEvent) => {
      try {
        const data: ChatEvent = JSON.parse(event.data)

        switch (data.type) {
          case 'CHUNK':
            if (data.content) {
              nextTick(() => {
                if (!isStreaming.value) {
                  isStreaming.value = true
                  streamingMessage.value = ''
                  streamingUsername.value = data.username
                }
                streamingMessage.value += data.content
              })
            }
            break
          case 'PROCESSING':
            nextTick(() => {
              messages.value = messages.value.filter(
                m => m.type !== MessageType.WAITING && m.type !== MessageType.PROCESSING
              )

              const processingMsg: ChatMessage = {
                id: `processing-${Date.now()}`,
                username: data.username || 'System',
                content: data.content || 'Processing...',
                timestamp: Date.now(),
                type: MessageType.PROCESSING
              }
              messages.value.push(processingMsg)
            })
            break
          case 'message':
          case 'MESSAGE':
            nextTick(() => {
              isStreaming.value = false
              streamingMessage.value = ''

              if (data.data) {
                const raw = (data.data as any).data || data.data

                if (!raw.type) {
                  raw.type = MessageType.BOT
                }

                if (raw.type !== MessageType.PROCESSING && raw.type !== MessageType.WAITING) {
                  messages.value = messages.value.filter(
                    m => m.type !== MessageType.PROCESSING && m.type !== MessageType.WAITING
                  )
                }
                messages.value.push(raw)
              }

              isSending.value = false
            })
            break

          case 'history':
            if (data.messages) {
              nextTick(() => {
                messages.value = data.messages!.map(msg => {
                  const raw = (msg as any).data || msg
                  return raw
                })
              })
            }
            break

          case 'error':
            console.error('Chat error:', data.message)
            lastError.value = data.message || 'Unknown error'

            isStreaming.value = false
            streamingMessage.value = ''
            isSending.value = false
            break
        }
      } catch (err) {
        console.error('Error parsing chat message:', err, event.data)
      }
    }

    chatWebsocket.value.onclose = (event: CloseEvent) => {
      console.log('Public chat WebSocket closed:', event.code, event.reason)
      isConnected.value = false

      if (shouldReconnect.value && [1000, 1001, 1006].includes(event.code)) {
        console.log('Reconnecting public chat in 3s...')
        setTimeout(() => connect(userToken), 3000)
      }
    }

    chatWebsocket.value.onerror = (error: Event) => {
      console.error('Public chat WebSocket error:', error)
      isConnected.value = false
      lastError.value = 'WebSocket connection error'
      isSending.value = false
    }
  }

  const disconnect = () => {
    shouldReconnect.value = false
    if (chatWebsocket.value) {
      chatWebsocket.value.close()
      chatWebsocket.value = null
      isConnected.value = false
    }
  }

  const sendMessage = (content: string, stationId: string, username: string) => {
    if (!isConnected.value || !chatWebsocket.value) {
      lastError.value = 'Not connected to chat server'
      return
    }
    if (!content.trim()) return

    isSending.value = true
    lastError.value = null

    const waitingMessage: ChatMessage = {
      id: `waiting-${Date.now()}`,
      username: 'System',
      content: 'Waiting for response...',
      timestamp: Date.now(),
      type: MessageType.WAITING
    }
    messages.value.push(waitingMessage)

    try {
      const payload = {
        action: 'sendMessage',
        username: username,
        content: content.trim(),
        stationId: stationId,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: MessageType.USER
      }
      chatWebsocket.value.send(JSON.stringify(payload))
    } catch (err) {
      console.error('Error sending message:', err)
      lastError.value = 'Failed to send message'
      isSending.value = false
      messages.value = messages.value.filter(m => m.type !== MessageType.PROCESSING)
    }
  }

  const getHistory = (limit: number = 50) => {
    if (!isConnected.value || !chatWebsocket.value) return
    try {
      chatWebsocket.value.send(JSON.stringify({ action: 'getHistory', limit }))
    } catch (err) {
      console.error('Error requesting history:', err)
    }
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
    messages,
    isConnected,
    isSending,
    lastError,
    streamingMessage,
    streamingUsername,
    isStreaming,
    connect,
    disconnect,
    sendMessage,
    getHistory,
    clearMessages
  }
})
