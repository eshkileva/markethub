import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { useChatSocket } from '@/features/messaging/model/use-chat-socket';
import { ChatAssistPanel } from '@/features/messaging/ui/ChatAssistPanel';
import { AiPagePitch } from '@/features/ai/ui/AiPagePitch';
import { ListingImage } from '@/entities/listing/ui/ListingImage';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  warnings?: string[];
};

type ConversationSummary = {
  id: string;
  updatedAt: string;
  unreadCount: number;
  listing: { id: string; title: string; imageUrl: string | null };
  peer: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  lastMessage: Message | null;
};

type ConversationDetail = {
  id: string;
  listing: { id: string; title: string; imageUrl: string | null } | null;
  peer: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  messages: Message[];
};

function dialogCountLabel(count: number) {
  const n10 = count % 10;
  const n100 = count % 100;
  if (n10 === 1 && n100 !== 11) return `${count} диалог`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `${count} диалога`;
  return `${count} диалогов`;
}

export function MessagesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: '/messages' });
  const { conversation: conversationId } = useSearch({ from: '/messages' });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [sendWarnings, setSendWarnings] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useChatSocket(token);

  const listQuery = useQuery({
    queryKey: ['conversations', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<{ items: ConversationSummary[] }>('/v1/conversations', { token }),
  });

  const threadQuery = useQuery({
    queryKey: ['conversation', conversationId, token],
    enabled: Boolean(token && conversationId),
    queryFn: async () => {
      const data = await apiRequest<ConversationDetail>(`/v1/conversations/${conversationId}`, {
        token,
      });
      await queryClient.invalidateQueries({ queryKey: ['conversations', 'unread'] });
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      apiRequest<Message>(`/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        token,
        body: { body },
      }),
    onSuccess: async (message) => {
      setDraft('');
      setSendWarnings(message.warnings ?? []);
      queryClient.setQueryData<ConversationDetail>(
        ['conversation', conversationId, token],
        (current) => {
          if (!current) return current;
          if (current.messages.some((item) => item.id === message.id)) return current;
          return { ...current, messages: [...current.messages, message] };
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadQuery.data?.messages.length]);

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Сообщения</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите, чтобы писать продавцам и отвечать покупателям.</p>
          <Button asChild>
            <Link to="/auth">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = listQuery.data?.items ?? [];
  const thread = threadQuery.data;
  const showList = !conversationId;
  const showThread = Boolean(conversationId);

  return (
    <div className="border-border bg-card flex h-full min-h-0 overflow-hidden lg:rounded-2xl lg:border lg:shadow-sm">
      <aside
        className={cn(
          'border-border flex w-full flex-col border-r lg:w-80 lg:shrink-0',
          showList ? 'flex' : 'hidden lg:flex',
        )}
      >
        <div className="border-border border-b px-4 py-4">
          <h1 className="text-lg font-semibold">Сообщения</h1>
          <p className="text-muted text-xs">{dialogCountLabel(items.length)}</p>
        </div>
        <div className="hidden p-3 sm:block">
          <AiPagePitch page="messages" compact />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {listQuery.isLoading ? <div className="text-muted p-4 text-sm">Загрузка…</div> : null}
          {items.length === 0 && !listQuery.isLoading ? (
            <div className="text-muted p-4 text-sm">
              Пока пусто. Откройте объявление и нажмите «Написать продавцу».
            </div>
          ) : null}
          {items.map((item) => {
            const active = item.id === conversationId;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'border-border flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors duration-200',
                  active ? 'bg-primary/5' : 'hover:bg-background',
                )}
                onClick={() => void navigate({ search: { conversation: item.id } })}
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {item.listing.imageUrl ? (
                    <ListingImage
                      src={item.listing.imageUrl}
                      alt={item.listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">
                      {item.peer?.displayName ?? item.peer?.username ?? 'Пользователь'}
                    </div>
                    {item.unreadCount > 0 ? (
                      <span className="bg-primary rounded-full px-1.5 text-[11px] font-semibold text-white">
                        {item.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted truncate text-xs">{item.listing.title}</div>
                  <div className="text-muted truncate text-xs">
                    {item.lastMessage?.body ?? 'Нет сообщений'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section
        className={cn('flex min-w-0 flex-1 flex-col', showThread ? 'flex' : 'hidden lg:flex')}
      >
        {conversationId && threadQuery.isLoading ? (
          <div className="text-muted flex flex-1 items-center justify-center text-sm">
            Загрузка…
          </div>
        ) : conversationId && thread ? (
          <>
            <div className="border-border flex items-center gap-2 border-b px-4 py-3 lg:px-5 lg:py-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Назад к списку диалогов"
                onClick={() => void navigate({ search: { conversation: undefined } })}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {thread.peer?.displayName ?? thread.peer?.username ?? 'Собеседник'}
                </div>
                {thread.listing ? (
                  <Link
                    to="/listings/$id"
                    params={{ id: thread.listing.id }}
                    className="text-primary block truncate text-xs"
                  >
                    {thread.listing.title}
                  </Link>
                ) : null}
              </div>
            </div>
            {conversationId && token ? (
              <ChatAssistPanel
                conversationId={conversationId}
                token={token}
                onInsertQuestion={(text) => setDraft(text)}
              />
            ) : null}
            {sendWarnings.length > 0 ? (
              <div className="mx-5 space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                {sendWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
            <div className="bg-background min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {thread.messages.map((message) => {
                const mine = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                        mine ? 'bg-primary text-white' : 'border-border bg-card border',
                      )}
                    >
                      {message.body}
                      <div
                        className={cn('mt-1 text-[11px]', mine ? 'text-white/70' : 'text-muted')}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form
              className="border-border flex gap-2 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:p-4 lg:pb-4"
              onSubmit={(event) => {
                event.preventDefault();
                const body = draft.trim();
                if (!body || sendMutation.isPending) return;
                sendMutation.mutate(body);
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Написать сообщение…"
                maxLength={4000}
              />
              <Button
                type="submit"
                disabled={!draft.trim() || sendMutation.isPending}
                aria-label="Отправить"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="text-muted hidden flex-1 items-center justify-center text-sm lg:flex">
            Выберите диалог слева
          </div>
        )}
      </section>
    </div>
  );
}
