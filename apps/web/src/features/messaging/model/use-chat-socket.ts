import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatSocketUrl } from '@/shared/api/client';

type IncomingMessage = {
  type: string;
  conversationId?: string;
  message?: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  };
};

type ConversationDetail = {
  messages: Array<{ id: string; senderId: string; body: string; createdAt: string }>;
};

export function useChatSocket(token: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(chatSocketUrl(token));
    const ping = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
      }
    }, 25_000);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as IncomingMessage;
        if (payload.type !== 'message' || !payload.conversationId || !payload.message) {
          return;
        }
        const conversationId = payload.conversationId;
        const message = payload.message;
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.setQueryData<ConversationDetail>(
          ['conversation', conversationId, token],
          (current) => {
            if (!current) return current;
            if (current.messages.some((item) => item.id === message.id)) {
              return current;
            }
            return { ...current, messages: [...current.messages, message] };
          },
        );
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      window.clearInterval(ping);
      socket.close();
    };
  }, [queryClient, token]);
}
