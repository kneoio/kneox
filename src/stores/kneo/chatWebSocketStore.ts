import { defineStore } from 'pinia';
import { ref, nextTick } from 'vue';
import apiClient from '../../api/apiClient';
import keycloak from '../../keycloakFactory.js';
import { MessageType } from '../../types/kneoBroadcasterTypes';

console.log( 'chatWebSocketStore loaded' );

export interface ChatMessage {
    id: string;
    username: string;
    content: string;
    timestamp: number;
    type: MessageType;
}

interface ChatEvent {
    type: 'MESSAGE' | 'message' |'history' | 'error' | 'CHUNK' | 'PROCESSING';
    data?: ChatMessage;
    messages?: ChatMessage[];
    message?: string;
    content?: string;
    username?: string;
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
    const streamingUsername = ref<string | undefined>( undefined );
    const isStreaming = ref( false );
    const shouldReconnect = ref( true );

    const buildWebSocketUrl = (): string => {
        const baseUrl = apiClient.defaults.baseURL || '';
        const urlObject = new URL( baseUrl );
        const host = urlObject.host;
        const wsUrl = `ws://${host}/api/ws/chat`;
        const token = keycloak.token;
        return token ? `${wsUrl}?token=${token}` : wsUrl;
    };

    const isWebSocketActive = ( ws: WebSocket | null | undefined ): boolean => {
        return (
            ws !== null &&
            ws !== undefined &&
            ( ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING )
        );
    };

    const connect = () => {
        if ( isWebSocketActive( chatWebsocket.value ) ) return;

        shouldReconnect.value = true;
        username.value =
            keycloak.tokenParsed?.preferred_username ||
            keycloak.tokenParsed?.email ||
            'User';

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
                //console.log( 'WebSocket message received:', data );

                switch ( data.type ) {
                    case 'CHUNK':
                        if ( data.content ) {
                            nextTick( () => {
                                if ( !isStreaming.value ) {
                                    isStreaming.value = true;
                                    streamingMessage.value = '';
                                    streamingUsername.value = data.username;
                                }
                                streamingMessage.value += data.content;
                            } );
                        }
                        break;
                    case 'PROCESSING':
                        console.log( 'WebSocket message received:', data );
                        nextTick( () => {
                            // Remove old WAITING/PROCESSING messages
                            messages.value = messages.value.filter( m =>
                                m.type !== MessageType.WAITING &&
                                m.type !== MessageType.PROCESSING
                            );

                            // Add new PROCESSING message
                            const processingMsg: ChatMessage = {
                                id: `processing-${Date.now()}`,
                                username: data.username || 'System',
                                content: data.content || 'Processing...',
                                timestamp: Date.now(),
                                type: MessageType.PROCESSING
                            };
                            messages.value.push( processingMsg );
                        } );
                        break;
                    case 'message':                        
                    case 'MESSAGE':
                        nextTick( () => {
                            isStreaming.value = false;
                            streamingMessage.value = '';

                            if ( data.data ) {
                                const raw = ( data.data as any ).data || data.data;
                                console.log( 'Message data:', raw );

                                if ( !raw.type ) {
                                    raw.type = MessageType.BOT;
                                }

                                if ( raw.type !== MessageType.PROCESSING && raw.type !== MessageType.WAITING ) {
                                    messages.value = messages.value.filter( m => m.type !== MessageType.PROCESSING && m.type !== MessageType.WAITING );
                                }
                                messages.value.push( raw );
                            }

                            isSending.value = false;
                        } );
                        break;

                    case 'history':
                        if ( data.messages ) {
                            nextTick( () => {
                                messages.value = data.messages!.map( msg => {
                                    const raw = ( msg as any ).data || msg;
                                    console.log( 'History message:', raw );
                                    return raw;
                                } );
                            } );
                        }
                        break;

                    case 'error':
                        console.error( 'Chat error:', data.message );
                        lastError.value = data.message || 'Unknown error';

                        isStreaming.value = false;
                        streamingMessage.value = '';
                        isSending.value = false;
                        break;
                }
            } catch ( err ) {
                console.error( 'Error parsing chat message:', err, event.data );
            }
        };

        chatWebsocket.value.onclose = ( event: CloseEvent ) => {
            console.log( 'Chat WebSocket closed:', event.code, event.reason );
            isConnected.value = false;

            if ( shouldReconnect.value && [1000, 1001, 1006].includes( event.code ) ) {
                console.log( 'Reconnecting chat in 3s...' );
                setTimeout( () => connect(), 3000 );
            }
        };

        chatWebsocket.value.onerror = ( error: Event ) => {
            console.error( 'Chat WebSocket error:', error );
            isConnected.value = false;
            lastError.value = 'WebSocket connection error';
            isSending.value = false;
        };
    };

    const disconnect = () => {
        shouldReconnect.value = false;
        if ( chatWebsocket.value ) {
            chatWebsocket.value.close();
            chatWebsocket.value = null;
            isConnected.value = false;
        }
    };

    const sendMessage = ( content: string, stationId?: string ) => {
        if ( !isConnected.value || !chatWebsocket.value ) {
            lastError.value = 'Not connected to chat server';
            return;
        }
        if ( !content.trim() ) return;

        isSending.value = true;
        lastError.value = null;

        const waitingMessage: ChatMessage = {
            id: `waiting-${Date.now()}`,
            username: 'System',
            content: 'Waiting for response...',
            timestamp: Date.now(),
            type: MessageType.WAITING
        };
        messages.value.push( waitingMessage );

        try {
            const payload = {
                action: 'sendMessage',
                username: username.value,
                content: content.trim(),
                stationId: stationId,
                id: `${Date.now()}-${Math.random().toString( 36 ).substr( 2, 9 )}`,
                timestamp: Date.now(),
                type: MessageType.USER
            };
            chatWebsocket.value.send( JSON.stringify( payload ) );
        } catch ( err ) {
            console.error( 'Error sending message:', err );
            lastError.value = 'Failed to send message';
            isSending.value = false;
            messages.value = messages.value.filter( m => m.type !== MessageType.PROCESSING );
        }
    };

    const getHistory = ( limit: number = 50 ) => {
        if ( !isConnected.value || !chatWebsocket.value ) return;
        try {
            chatWebsocket.value.send( JSON.stringify( { action: 'getHistory', limit } ) );
        } catch ( err ) {
            console.error( 'Error requesting history:', err );
        }
    };

    const clearMessages = () => {
        messages.value = [];
    };

    return {
        messages,
        isConnected,
        isSending,
        lastError,
        username,
        streamingMessage,
        streamingUsername,
        isStreaming,
        connect,
        disconnect,
        sendMessage,
        getHistory,
        clearMessages
    };
} );
