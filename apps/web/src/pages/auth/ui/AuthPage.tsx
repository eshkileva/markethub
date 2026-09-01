import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import {
  loginSchema,
  registerSchema,
  type AuthResponse,
  type CountryCode,
} from '@markethub/shared';
import { CountrySelect } from '@/entities/geo/ui/CountrySelect';
import { apiRequest } from '@/shared/api/client';
import type { AuthUser } from '@markethub/shared';
import { useAuthStore } from '@/shared/model/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { BrandMark } from '@/shared/ui/brand-mark';
import { AiPagePitch } from '@/features/ai/ui/AiPagePitch';
import { mapAuthError } from '../model/map-auth-error';

function authDestination(user: AuthUser) {
  return user.emailVerified ? '/' : '/verify-email';
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const loginForm = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = loginSchema.safeParse(value);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Ошибка валидации');
        return;
      }
      try {
        const data = await apiRequest<AuthResponse>('/v1/auth/login', {
          method: 'POST',
          body: parsed.data,
          skipAuth: true,
        });
        setSession(data.accessToken, data.user, data.expiresIn);
        await navigate({ to: authDestination(data.user) });
      } catch (err) {
        setError(err instanceof Error ? mapAuthError(err.message) : 'Не удалось войти');
      }
    },
  });

  const registerForm = useForm({
    defaultValues: {
      email: '',
      password: '',
      username: '',
      country: 'RU' as CountryCode,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = registerSchema.safeParse(value);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Ошибка валидации');
        return;
      }
      try {
        const data = await apiRequest<AuthResponse>('/v1/auth/register', {
          method: 'POST',
          body: parsed.data,
          skipAuth: true,
        });
        setSession(data.accessToken, data.user, data.expiresIn);
        await navigate({ to: authDestination(data.user) });
      } catch (err) {
        setError(
          err instanceof Error ? mapAuthError(err.message) : 'Не удалось зарегистрироваться',
        );
      }
    },
  });

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-4 px-4 py-8">
      <AiPagePitch page="auth" compact />
      <div
        className="bg-primary/15 pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full blur-3xl"
        aria-hidden
      />
      <div
        className="bg-accent/20 pointer-events-none absolute -right-10 bottom-6 h-32 w-32 rounded-full blur-3xl"
        aria-hidden
      />
      <Card className="relative w-full">
        <CardHeader>
          <BrandMark tone="onLight" className="mb-3" />
          <CardTitle>{mode === 'login' ? 'Вход в Купилко' : 'Регистрация'}</CardTitle>
          <p className="text-muted text-sm">
            {mode === 'login'
              ? 'Войдите по email и паролю, чтобы писать продавцам и размещать объявления.'
              : 'Один аккаунт для BY, RU и KZ. После регистрации подтвердите email кодом из письма.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'login' ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void loginForm.handleSubmit();
              }}
            >
              <loginForm.Field name="email">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </loginForm.Field>
              <loginForm.Field name="password">
                {(field) => (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="password">Пароль</Label>
                      <Link
                        to="/forgot-password"
                        className="text-primary text-xs font-medium hover:underline"
                      >
                        Забыли пароль?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </loginForm.Field>
              {error ? <p className="text-danger text-sm">{error}</p> : null}
              <Button type="submit" className="w-full">
                Войти
              </Button>
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void registerForm.handleSubmit();
              }}
            >
              <registerForm.Field name="email">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="username">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Ник</Label>
                    <Input
                      id="username"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="password">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="country">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Страна</Label>
                    <CountrySelect
                      id="country"
                      value={field.state.value}
                      onChange={(value) => field.handleChange(value as CountryCode)}
                    />
                  </div>
                )}
              </registerForm.Field>
              {error ? <p className="text-danger text-sm">{error}</p> : null}
              <Button type="submit" className="w-full">
                Создать аккаунт
              </Button>
            </form>
          )}

          <button
            type="button"
            className="text-primary w-full text-center text-sm"
            onClick={() => {
              setError(null);
              setMode((m) => (m === 'login' ? 'register' : 'login'));
            }}
          >
            {mode === 'login' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
