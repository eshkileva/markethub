import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { forgotPasswordSchema, resetPasswordSchema } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { mapAuthError } from '@/pages/auth/model/map-auth-error';

type Step = 'request' | 'reset' | 'done';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devResetCode, setDevResetCode] = useState<string | null>(null);

  async function requestCode() {
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Проверьте email');
      return;
    }
    setBusy(true);
    try {
      const data = await apiRequest<{ ok: true; devResetCode?: string }>(
        '/v1/auth/forgot-password',
        {
          method: 'POST',
          body: parsed.data,
          skipAuth: true,
        },
      );
      setDevResetCode(data.devResetCode ?? null);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? mapAuthError(err.message) : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError(null);
    const parsed = resetPasswordSchema.safeParse({ email, code, newPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Проверьте форму');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/v1/auth/reset-password', {
        method: 'POST',
        body: parsed.data,
        skipAuth: true,
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? mapAuthError(err.message) : 'Не удалось сменить пароль');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-8">
      <Card className="relative w-full">
        <CardHeader>
          <BrandMark tone="onLight" className="mb-3" />
          <CardTitle>{step === 'done' ? 'Пароль обновлён' : 'Восстановление пароля'}</CardTitle>
          <p className="text-muted text-sm">
            {step === 'request'
              ? 'Отправим одноразовый код на email — как при подтверждении регистрации.'
              : step === 'reset'
                ? `Код отправлен на ${email}. Введите его и новый пароль.`
                : 'Теперь можно войти с новым паролем.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'request' ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void requestCode();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error ? <p className="text-danger text-sm">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                Отправить код
              </Button>
            </form>
          ) : null}

          {step === 'reset' ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void resetPassword();
              }}
            >
              {devResetCode ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Dev-код: <span className="font-mono font-semibold">{devResetCode}</span>
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="reset-code">Код из письма</Label>
                <Input
                  id="reset-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-password">Новый пароль</Label>
                <Input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {error ? <p className="text-danger text-sm">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                Сохранить пароль
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => void requestCode()}
              >
                Отправить код повторно
              </Button>
            </form>
          ) : null}

          {step === 'done' ? (
            <Button className="w-full" onClick={() => void navigate({ to: '/auth' })}>
              Перейти ко входу
            </Button>
          ) : null}

          <Link to="/auth" className="text-primary block text-center text-sm hover:underline">
            ← Назад ко входу
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
