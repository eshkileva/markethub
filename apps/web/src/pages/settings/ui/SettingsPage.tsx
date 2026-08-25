import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePasswordSchema, updateProfileSchema, type CountryCode } from '@markethub/shared';
import { apiRequest, apiUpload } from '@/shared/api/client';
import { logoutSession } from '@/shared/api/session';
import { useAuthStore, type AuthUser, useUiStore, type ThemeMode } from '@/shared/model/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Combobox } from '@/shared/ui/combobox';
import { CitySelect } from '@/entities/geo/ui/CitySelect';
import { CountrySelect } from '@/entities/geo/ui/CountrySelect';

type MeResponse = {
  user: AuthUser;
  identities: Array<{ id: string; provider: string; createdAt: string }>;
};

type SessionsResponse = {
  items: Array<{
    id: string;
    userAgent: string | null;
    ip: string | null;
    createdAt: string;
    expiresAt: string;
    current: boolean;
  }>;
};

function mapSettingsError(message: string) {
  if (message === 'Username already taken') return 'Этот ник уже занят';
  if (message === 'Invalid current password') return 'Неверный текущий пароль';
  if (message === 'New password must be different') return 'Новый пароль должен отличаться';
  if (message === 'Password login is not available for this account') {
    return 'Для этого аккаунта нельзя сменить пароль';
  }
  return message;
}

export function SettingsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<MeResponse>('/v1/auth/me', { token }),
  });

  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<SessionsResponse>('/v1/auth/sessions', { token }),
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted text-sm">Тема доступна без входа.</p>
        </div>
        <ThemeCard />
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent className="text-muted space-y-3 text-sm">
            <p>Войдите, чтобы менять профиль, пароль и сессии.</p>
            <Button onClick={() => void navigate({ to: '/auth' })}>Войти</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (meQuery.isLoading || !meQuery.data) {
    return <Card className="h-64 animate-pulse bg-slate-100" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted text-sm">Профиль, тема, безопасность и активные сессии.</p>
      </div>
      <ThemeCard />
      <ProfileCard
        user={meQuery.data.user}
        identities={meQuery.data.identities}
        token={token}
        onSaved={async (user) => {
          setUser(user);
          await queryClient.invalidateQueries({ queryKey: ['auth'] });
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
        }}
      />
      <PasswordCard token={token} />
      <SessionsCard
        items={sessionsQuery.data?.items ?? []}
        loading={sessionsQuery.isLoading}
        onLogout={async () => {
          await logoutSession();
          await navigate({ to: '/auth' });
        }}
        onLogoutAll={async () => {
          await apiRequest('/v1/auth/logout-all', { method: 'POST', token });
          clearSession();
          await navigate({ to: '/auth' });
        }}
      />
    </div>
  );
}

function ThemeCard() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const options: Array<{ id: ThemeMode; label: string }> = [
    { id: 'system', label: 'Как в системе' },
    { id: 'light', label: 'Светлая' },
    { id: 'dark', label: 'Тёмная' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оформление</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={theme === option.id ? 'default' : 'secondary'}
            onClick={() => setTheme(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function ProfileCard({
  user,
  identities,
  token,
  onSaved,
}: {
  user: AuthUser;
  identities: MeResponse['identities'];
  token: string;
  onSaved: (user: AuthUser) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [country, setCountry] = useState<CountryCode>((user.country as CountryCode) ?? 'RU');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayName(user.displayName ?? '');
    setUsername(user.username);
    setBio(user.bio ?? '');
    setCity(user.city ?? '');
    setCountry((user.country as CountryCode) ?? 'RU');
    setAvatarUrl(user.avatarUrl);
  }, [user]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = updateProfileSchema.safeParse({
        displayName: displayName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
        city: city.trim() || null,
        country,
        avatarUrl,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Проверьте форму');
      }
      return apiRequest<AuthUser>('/v1/auth/profile', {
        method: 'PATCH',
        token,
        body: parsed.data,
      });
    },
    onSuccess: async (next) => {
      setError(null);
      setDone(true);
      await onSaved(next);
    },
    onError: (err) => {
      setDone(false);
      setError(err instanceof Error ? mapSettingsError(err.message) : 'Не удалось сохранить');
    },
  });

  async function onAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    try {
      const uploaded = await apiUpload<{ url: string }>('/v1/media/upload', file, token);
      setAvatarUrl(uploaded.url);
      setDone(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить фото');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Профиль</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-base">
              {(displayName || username).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Label htmlFor="avatar">Аватар</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => void onAvatar(e.target.files)}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Имя</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Ник</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Страна</Label>
            <CountrySelect
              id="country"
              value={country}
              onChange={(value) => setCountry(value as CountryCode)}
              onCountryChange={() => setCity('')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Город</Label>
            <CitySelect
              id="city"
              country={country}
              value={city}
              allowEmpty
              emptyLabel="Не указан"
              onChange={setCity}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">О себе</Label>
          <Textarea id="bio" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <p className="text-muted text-xs">
          Входы: {identities.map((item) => item.provider).join(', ') || 'email'} · {user.email}
        </p>
        {error ? <p className="text-danger text-sm">{error}</p> : null}
        {done ? <p className="text-success text-sm">Профиль сохранён.</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
            Сохранить
          </Button>
          <Button asChild variant="secondary">
            <Link to="/profile/$username" params={{ username: user.username }}>
              Открыть профиль
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordCard({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Проверьте форму');
      }
      return apiRequest('/v1/auth/change-password', { method: 'POST', token, body: parsed.data });
    },
    onSuccess: () => {
      setError(null);
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err) => {
      setDone(false);
      setError(err instanceof Error ? mapSettingsError(err.message) : 'Не удалось сменить пароль');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Пароль</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Текущий</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Новый</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        {error ? <p className="text-danger text-sm">{error}</p> : null}
        {done ? <p className="text-success text-sm">Пароль обновлён.</p> : null}
        <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
          Сменить пароль
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionsCard({
  items,
  loading,
  onLogout,
  onLogoutAll,
}: {
  items: SessionsResponse['items'];
  loading: boolean;
  onLogout: () => Promise<void>;
  onLogoutAll: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сессии</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-muted text-sm">Загружаем сессии…</p> : null}
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="border-border bg-background rounded-2xl border px-4 py-3 text-sm"
            >
              <div className="font-medium">
                {item.current ? 'Это устройство' : 'Другое устройство'}
              </div>
              <div className="text-muted mt-1 text-xs">
                {item.userAgent ?? 'Неизвестный браузер'}
                {item.ip ? ` · ${item.ip}` : ''}
                {' · '}
                {new Date(item.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
        {error ? <p className="text-danger text-sm">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onLogout().catch((err) => {
                setError(err instanceof Error ? err.message : 'Не удалось выйти');
                setBusy(false);
              });
            }}
          >
            Выйти
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onLogoutAll().catch((err) => {
                setError(
                  err instanceof Error
                    ? mapSettingsError(err.message)
                    : 'Не удалось завершить сессии',
                );
                setBusy(false);
              });
            }}
          >
            Выйти везде
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
