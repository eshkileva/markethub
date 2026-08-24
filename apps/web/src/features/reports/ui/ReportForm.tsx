import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createReportSchema, REPORT_REASONS, type ReportReason } from '@markethub/shared';
import { Flag } from 'lucide-react';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

const errorMessages: Record<string, string> = {
  'You cannot report your own listing': 'Нельзя пожаловаться на своё объявление',
  'You cannot report yourself': 'Нельзя пожаловаться на себя',
  'You already have an open report': 'У вас уже есть открытая жалоба',
  'listingId or userId is required': 'Укажите объявление или пользователя',
  'Listing not found': 'Объявление не найдено',
  'User not found': 'Пользователь не найден',
};

function mapReportError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Не удалось отправить жалобу';
  return errorMessages[message] ?? message;
}

const reasonLabels: Record<ReportReason, string> = {
  spam: 'Спам',
  fraud: 'Мошенничество',
  prohibited: 'Запрещённый товар',
  offensive: 'Оскорбления',
  other: 'Другое',
};

export function ReportForm({ listingId, userId }: { listingId?: string; userId?: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = createReportSchema.safeParse({
        listingId,
        userId,
        reason,
        details: details.trim() || undefined,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Проверьте форму');
      }
      return apiRequest('/v1/reports', { method: 'POST', token, body: parsed.data });
    },
    onSuccess: () => {
      setError(null);
      setDone(true);
    },
    onError: (err) => {
      setError(mapReportError(err));
    },
  });

  if (!token) {
    return null;
  }

  if (done) {
    return <p className="text-muted text-sm">Жалоба отправлена. Модератор проверит её.</p>;
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" />
        Пожаловаться
      </Button>
    );
  }

  return (
    <form
      className="border-border bg-background space-y-3 rounded-2xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        submit.mutate();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="report-reason">Причина</Label>
        <select
          id="report-reason"
          className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
        >
          {REPORT_REASONS.map((item) => (
            <option key={item} value={item}>
              {reasonLabels[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="report-details">Комментарий</Label>
        <Textarea
          id="report-details"
          value={details}
          maxLength={2000}
          placeholder="Коротко опишите, что не так"
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={submit.isPending}>
          Отправить
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
