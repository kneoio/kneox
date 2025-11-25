import { defineStore } from 'pinia';
import { ref, nextTick } from 'vue';
import apiClient from '../../api/apiClient';
import keycloak from '../../keycloakFactory.js'; // Added .js extension

console.log( 'chatWebSocketStore loaded' ); // Debug log

export interface ChatMessage {
    id: string;
    username: string;
    content: string;
    timestamp: number;
    isBot: boolean;
}

interface ChatEvent {
    type: 'message' | 'history' | 'error' | 'chunk';
    data?: ChatMessage;
    messages?: ChatMessage[];
    message?: string;
    content?: string;
    connectionId?: string;
    timestamp?: number;
}

export const useChatWebSocketStore = defineStore( 'chatWebSocketStore', () => {
    const chatWebsocket = ref<WebSocket | null>( null );
    const messages = ref<ChatMessage[]>( [] );
    const isConnected = ref( false );
    const isSending = ref( false );
    const lastError = ref<string | null>( null );
    const username = ref<string>( '' );
    const streamingMessage = ref<string>( '' );
    const isStreaming = ref( false );

    const buildWebSocketUrl = (): string => {
        const baseUrl = apiClient.defaults.baseURL || '';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const urlObject = new URL( baseUrl );
        const host = urlObject.host;
        const wsUrl = `${wsProtocol}//${host}/api/ws/chat`;
        const token = keycloak.token;
        return token ? `${wsUrl}?token=${token}` : wsUrl;
    };

    const isWebSocketActive = ( ws: WebSocket | null | undefined ): boolean => {
        return ws !== null && ws !== undefined &&
            ( ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING );
    };

    const connect = () => {
        if ( isWebSocketActive( chatWebsocket.value ) ) return;

        username.value = keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email || 'User';

        chatWebsocket.value = new WebSocket( buildWebSocketUrl() );

        chatWebsocket.value.onopen = () => {
            console.log( 'Chat WebSocket opened' );
            isConnected.value = true;
            lastError.value = null;
            getHistory();
        };

        chatWebsocket.value.onmessage = ( event: MessageEvent ) => {
            try {
                const data: ChatEvent = JSON.parse( event.data );
                // console.log( 'WS Received:', data.type, data ); // Debug logging

                switch ( data.type ) {
                    case 'chunk':
                        if ( data.content ) {
                            nextTick( () => {
                                if ( !isStreaming.value ) {
                                    isStreaming.value = true;
                                    streamingMessage.value = '';
                                }
                                streamingMessage.value += data.content;
                            } );
                        }
                        break;

                    case 'message':
                        nextTick( () => {
                            isStreaming.value = false;
                            streamingMessage.value = '';
                            if ( data.data ) {
                                messages.value.push( data.data );
                            }
                        } );
                        break;

                    case 'history':
                        if ( data.messages ) {
                            nextTick( () => {
                                messages.value = data.messages!;
                            } );
                        }
                        break;

                    case 'error':
                        console.error( 'Chat error:', data.message );
                        lastError.value = data.message || 'Unknown error';

                        // HACK: If the error message contains a valid message JSON, treat it as a message
                        // This handles the weird backend behavior seen in logs
                        if ( data.message && data.message.startsWith( '{"type":"message"' ) ) {
                            try {
                                const innerData = JSON.parse( data.message );
                                if ( innerData.type === 'message' && innerData.data ) {
                                    console.log( 'Recovered message from error:', innerData.data );
                                    nextTick( () => {
                                        messages.value.push( innerData.data );
                                    } );
                                }
                            } catch ( e ) {
                                console.error( 'Failed to recover message from error', e );
                            }
                        }

                        isStreaming.value = false;
                        streamingMessage.value = '';
                        break;
                }
            } catch ( error ) {
                console.error( 'Error parsing chat message:', error, event.data );
            }
        };

        chatWebsocket.value.onclose = ( event: CloseEvent ) => {
            console.log( 'Chat WebSocket closed:', event.code, event.reason );
            isConnected.value = false;

            if ( [1000, 1001, 1006].includes( event.code ) ) {
                console.log( 'Reconnecting chat in 3s...' );
                setTimeout( () => {
                    connect();
                }, 3000 );
            }
        };

        chatWebsocket.value.onerror = ( error: Event ) => {
            console.error( 'Chat WebSocket error:', error );
            isConnected.value = false;
            lastError.value = 'WebSocket connection error';
        };
    };

    const disconnect = () => {
        if ( chatWebsocket.value ) {
            chatWebsocket.value.close();
            chatWebsocket.value = null;
            isConnected.value = false;
        }
    };

    const sendMessage = ( content: string ) => {
        if ( !isConnected.value || !chatWebsocket.value ) {
            console.error( 'WebSocket not connected' );
            lastError.value = 'Not connected to chat server';
            return;
        }

        if ( !content.trim() ) {
            return;
        }

        isSending.value = true;
        lastError.value = null;

        try {
            chatWebsocket.value.send( JSON.stringify( {
                action: 'sendMessage',
                username: username.value,
                content: content.trim()
            } ) );
        } catch ( error ) {
            console.error( 'Error sending message:', error );
            lastError.value = 'Failed to send message';
        } finally {
            isSending.value = false;
        }
    };

    const getHistory = ( limit: number = 50 ) => {
        if ( !isConnected.value || !chatWebsocket.value ) {
            console.error( 'WebSocket not connected' );
            return;
        }

        try {
            chatWebsocket.value.send( JSON.stringify( {
                action: 'getHistory',
                limit
            } ) );
        } catch ( error ) {
            console.error( 'Error requesting history:', error );
        }
    };

    const clearMessages = () => {
        messages.value = [];
    };

    return {
        // State
        messages,
        isConnected,
        isSending,
        lastError,
        username,
        streamingMessage,
        isStreaming,

        // Actions
        connect,
        disconnect,
        sendMessage,
        getHistory,
        clearMessages
    };
} );
