import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import { MessageType } from '../../types/kneoBroadcasterTypes'
import { apiServer } from '../../api/apiClient'
import { usePublicChatStore } from './publicChatStore'

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
  const currentBrandSlug = ref<string>('')
  const currentUserToken = ref<string>('')
  const reconnectAttempts = ref(0)
  const reconnectTimeouts = [1000, 3000, 6000, 10000, 15000, 30000] // Exponential backoff up to 30s

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

  const connect = async (userToken: string, brandSlug: string) => {
    console.log('[WebSocket] Attempting to connect with token:', userToken.substring(0, 8) + '...')
    
    if (isWebSocketActive(chatWebsocket.value)) {
      console.log('[WebSocket] Already connected or connecting')
      return
    }

    // TODO: Re-enable token validation once backend is properly configured
    /*
    // Validate token before connecting
    const publicChatStore = usePublicChatStore()
    try {
      console.log('[WebSocket] Validating token before connection...')
      const validation = await publicChatStore.validateTokenWithAuth(userToken)
      console.log('[WebSocket] Token validation result:', validation)
      
      if (!validation.success || !validation.valid) {
        console.warn('[WebSocket] Token validation failed before WebSocket connection')
        publicChatStore.clearAuthTokens()
        lastError.value = 'Authentication failed. Please re-authenticate.'
        // Trigger re-authentication flow
        window.location.reload()
        return
      }
    } catch (error) {
      console.error('[WebSocket] Token validation error:', error)
      publicChatStore.clearAuthTokens()
      lastError.value = 'Authentication error. Please re-authenticate.'
      window.location.reload()
      return
    }
    */

    shouldReconnect.value = true
    currentUserToken.value = userToken
    currentBrandSlug.value = brandSlug
    
    console.log('[WebSocket] Creating WebSocket connection...')
    chatWebsocket.value = new WebSocket(buildWebSocketUrl(userToken))

    chatWebsocket.value.onopen = () => {
      console.log('Public chat WebSocket opened')
      isConnected.value = true
      lastError.value = null
      reconnectAttempts.value = 0 // Reset attempts on successful connection
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

      // Only handle authentication failures if we have explicit auth error
      // 1006 alone is not enough to determine auth vs server down
      if (event.code === 4000 || event.code === 4001 || event.code === 4003) {
        // Custom codes for auth errors (if backend sends them)
        console.warn('[WebSocket] Authentication failure - explicit auth code')
        const publicChatStore = usePublicChatStore()
        publicChatStore.clearAuthTokens()
        lastError.value = 'Authentication failed. Please re-authenticate.'
        shouldReconnect.value = false
        window.location.reload()
        return
      }

      // For all other cases (1000, 1001, 1006), try to reconnect
      // This includes server downtime, network issues, etc.
      if (shouldReconnect.value && [1000, 1001, 1006].includes(event.code)) {
        const timeoutIndex = Math.min(reconnectAttempts.value, reconnectTimeouts.length - 1)
        const delay = reconnectTimeouts[timeoutIndex]
        reconnectAttempts.value++
        console.log(`[NEW LOGIC] Reconnecting public chat in ${delay/1000}s... (attempt ${reconnectAttempts.value})`)
        setTimeout(() => connect(currentUserToken.value, currentBrandSlug.value), delay)
      } else {
        console.log('Not reconnecting - shouldReconnect:', shouldReconnect.value, 'code:', event.code)
        if (!shouldReconnect.value) {
          lastError.value = 'Disconnected manually'
        } else {
          lastError.value = `Connection closed (code: ${event.code})`
        }
      }
    }

    chatWebsocket.value.onerror = (error: Event) => {
      console.error('Public chat WebSocket error:', error)
      isConnected.value = false
      lastError.value = 'WebSocket connection error'
      isSending.value = false
      
      // Try to determine if it's an auth error or server unavailable
      // If the server responds at all, it's likely an auth error
      // If it fails to connect entirely, it's server unavailable
    }
  }

  const disconnect = () => {
    shouldReconnect.value = false
    reconnectAttempts.value = 0
    if (chatWebsocket.value) {
      chatWebsocket.value.close()
      chatWebsocket.value = null
      isConnected.value = false
    }
  }

  const sendMessage = (content: string, brandSlug: string, username: string) => {
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
      content: '',
      timestamp: Date.now(),
      type: MessageType.WAITING
    }
    messages.value.push(waitingMessage)

    try {
      const payload = {
        action: 'sendMessage',
        username: username,
        content: content.trim(),
        brandSlug: brandSlug,
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
      chatWebsocket.value.send(JSON.stringify({ action: 'getHistory', brandSlug: currentBrandSlug.value, limit }))
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
