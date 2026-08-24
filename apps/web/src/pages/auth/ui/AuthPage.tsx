import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { loginSchema, registerSchema, COUNTRIES, type CountryCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, type AuthUser } from '@/shared/model/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { mapAuthError } from '../model/map-auth-error';

type AuthResponse = { accessToken: string; user: AuthUser; expiresIn?: number };

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
        await navigate({ to: '/' });
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
        await navigate({ to: '/' });
      } catch (err) {
        setError(
          err instanceof Error ? mapAuthError(err.message) : 'Не удалось зарегистрироваться',
        );
      }
    },
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Вход в MarketHub' : 'Регистрация'}</CardTitle>
          <p className="text-muted text-sm">
            {mode === 'login'
              ? 'Войдите по email и паролю, чтобы писать продавцам и размещать объявления.'
              : 'Один аккаунт для BY, RU и KZ. После регистрации можно сразу публиковать и писать в чат.'}
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
                    <Label htmlFor="password">Пароль</Label>
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
                    <select
                      id="country"
                      className="border-border bg-card flex h-10 w-full rounded-xl border px-3 text-sm"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as CountryCode)}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.nameRu}
                        </option>
                      ))}
                    </select>
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
