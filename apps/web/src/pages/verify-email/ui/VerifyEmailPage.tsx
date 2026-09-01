import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { verifyEmailSchema } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, type AuthUser } from '@/shared/model/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { BrandMark } from '@/shared/ui/brand-mark';
import { mapAuthError } from '@/pages/auth/model/map-auth-error';

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!user) {
      void navigate({ to: '/auth' });
      return;
    }
    if (user.emailVerified) {
      void navigate({ to: '/' });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = verifyEmailSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ошибка валидации');
      return;
    }
    if (!token) return;

    setBusy(true);
    try {
      const updated = await apiRequest<AuthUser>('/v1/auth/verify-email', {
        method: 'POST',
        body: parsed.data,
        token,
      });
      setUser(updated);
      await navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? mapAuthError(err.message) : 'Не удалось подтвердить email');
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (!token || cooldown > 0) return;
    setError(null);
    setResendBusy(true);
    try {
      await apiRequest<{ ok: true; devVerificationCode?: string }>('/v1/auth/resend-verification', {
        method: 'POST',
        token,
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? mapAuthError(err.message) : 'Не удалось отправить код');
    } finally {
      setResendBusy(false);
    }
  }

  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <Card className="relative w-full">
        <CardHeader>
          <BrandMark tone="onLight" className="mb-3" />
          <CardTitle>Подтвердите email</CardTitle>
          <p className="text-muted text-sm">
            Мы отправили 6-значный код на <span className="font-medium">{user.email}</span>. Введите
            его, чтобы публиковать объявления и писать продавцам.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={(e) => void submitCode(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="verify-code">Код из письма</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            {error ? <p className="text-danger text-sm">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Проверяем…' : 'Подтвердить'}
            </Button>
          </form>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={resendBusy || cooldown > 0}
            onClick={() => void resendCode()}
          >
            {cooldown > 0
              ? `Отправить снова через ${cooldown} с`
              : resendBusy
                ? 'Отправляем…'
                : 'Отправить код снова'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
