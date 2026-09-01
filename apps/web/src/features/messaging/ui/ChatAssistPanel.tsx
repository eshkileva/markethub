import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

type ChatAssistResponse = {
  role: 'buyer' | 'seller';
  categorySlug: string | null;
  listingTitle: string;
  questions: string[];
  safeDealTips: string[];
};

export function ChatAssistPanel({
  conversationId,
  token,
  onInsertQuestion,
}: {
  conversationId: string;
  token: string;
  onInsertQuestion: (text: string) => void;
}) {
  const assistQuery = useQuery({
    queryKey: ['conversation', conversationId, 'assist', token],
    queryFn: () =>
      apiRequest<ChatAssistResponse>(`/v1/conversations/${conversationId}/assist`, { token }),
  });

  const assist = assistQuery.data;
  if (!assist || assistQuery.isLoading) return null;

  if (assist.role !== 'buyer') {
    return (
      <Card className="border-border bg-muted/30 mx-5 mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Безопасная сделка</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted list-disc space-y-1 pl-5 text-xs">
            {assist.safeDealTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/15 bg-primary/5 mx-5 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Поможет решить, покупать или нет</CardTitle>
        <p className="text-muted text-xs">{assist.listingTitle}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium">Спросите у продавца</p>
          <div className="flex flex-col gap-2">
            {assist.questions.map((question) => (
              <Button
                key={question}
                type="button"
                size="sm"
                variant="secondary"
                className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-xs leading-snug"
                onClick={() => onInsertQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
        <details className="text-muted text-xs">
          <summary className="cursor-pointer select-none">Безопасность сделки</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {assist.safeDealTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}
