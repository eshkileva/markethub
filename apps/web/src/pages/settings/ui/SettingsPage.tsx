import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePasswordSchema, updateProfileSchema, type CountryCode } from '@markethub/shared';
import { Lock, Monitor, Palette, User } from 'lucide-react';
import { apiRequest, apiUpload } from '@/shared/api/client';
import { logoutSession } from '@/shared/api/session';
import type { AuthUser } from '@markethub/shared';
import { useAuthStore, type ThemeMode, useUiStore } from '@/shared/model/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { CitySelect } from '@/entities/geo/ui/CitySelect';
import { CountrySelect } from '@/entities/geo/ui/CountrySelect';
import { cn } from '@/shared/lib/cn';

type SettingsSection = 'profile' | 'security' | 'appearance' | 'devices';

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

const sections: Array<{ id: SettingsSection; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'security', label: 'Безопасность', icon: Lock },
  { id: 'appearance', label: 'Оформление', icon: Palette },
  { id: 'devices', label: 'Устройства', icon: Monitor },
];

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
  const [section, setSection] = useState<SettingsSection>('profile');

  if (!token) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <SettingsHeader />
        <div className="flex flex-col gap-6 lg:flex-row">
          <SettingsNav active="appearance" onChange={() => undefined} guest />
          <div className="min-w-0 flex-1 space-y-4">
            <AppearanceSection />
            <Card>
              <CardContent className="space-y-3 p-6 text-sm">
                <p className="font-medium">Профиль и безопасность</p>
                <p className="text-muted">
                  Войдите, чтобы менять имя, пароль и управлять активными сессиями.
                </p>
                <Button asChild>
                  <Link to="/auth">Войти или зарегистрироваться</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <AuthenticatedSettings section={section} onSectionChange={setSection} />;
}

function SettingsHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
      <p className="text-muted mt-1 text-sm">
        Профиль, безопасность, оформление и устройства — как в личном кабинете Avito/Kufar.
      </p>
    </div>
  );
}

function SettingsNav({
  active,
  onChange,
  guest = false,
}: {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
  guest?: boolean;
}) {
  return (
    <nav className="lg:w-56 lg:shrink-0">
      <div className="border-border bg-card flex gap-1 overflow-x-auto rounded-2xl border p-1 lg:flex-col lg:overflow-visible lg:p-2">
        {sections.map((item) => {
          const Icon = item.icon;
          const disabled = guest && item.id !== 'appearance';
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                active === item.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-45',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AuthenticatedSettings({
  section,
  onSectionChange,
}: {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}) {
  const token = useAuthStore((s) => s.accessToken)!;
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => apiRequest<MeResponse>('/v1/auth/me', { token }),
  });

  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions', token],
    queryFn: () => apiRequest<SessionsResponse>('/v1/auth/sessions', { token }),
  });

  if (meQuery.isLoading || !meQuery.data) {
    return <Card className="bg-surface-secondary h-64 animate-pulse" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SettingsHeader />
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav active={section} onChange={onSectionChange} />
        <div className="min-w-0 flex-1">
          {section === 'profile' ? (
            <ProfileSection
              user={meQuery.data.user}
              identities={meQuery.data.identities}
              token={token}
              onSaved={async (user) => {
                setUser(user);
                await queryClient.invalidateQueries({ queryKey: ['auth'] });
                await queryClient.invalidateQueries({ queryKey: ['profile'] });
              }}
            />
          ) : null}
          {section === 'security' ? <SecuritySection token={token} /> : null}
          {section === 'appearance' ? <AppearanceSection /> : null}
          {section === 'devices' ? (
            <DevicesSection
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
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsSectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-muted mt-1 text-sm">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function ProfileSection({
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
    <SettingsSectionCard
      title="Профиль"
      description="Имя, контакты и город — видны покупателям на объявлениях."
    >
      <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">
            {(displayName || username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Label htmlFor="avatar">Фото профиля</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => void onAvatar(e.target.files)}
          />
        </div>
      </div>

      <div className="divide-border divide-y">
        <SettingsField label="Email">
          <Input value={user.email} disabled className="bg-surface-secondary" />
        </SettingsField>
        <SettingsField label="Имя">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </SettingsField>
        <SettingsField label="Ник">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </SettingsField>
        <SettingsField label="Страна">
          <CountrySelect
            value={country}
            onChange={(value) => setCountry(value as CountryCode)}
            onCountryChange={() => setCity('')}
          />
        </SettingsField>
        <SettingsField label="Город">
          <CitySelect
            country={country}
            value={city}
            allowEmpty
            emptyLabel="Не указан"
            onChange={setCity}
          />
        </SettingsField>
        <SettingsField label="О себе">
          <Textarea maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
        </SettingsField>
      </div>

      <p className="text-muted text-xs">
        Способы входа: {identities.map((item) => item.provider).join(', ') || 'email'}
      </p>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      {done ? <p className="text-success text-sm">Изменения сохранены.</p> : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
          Сохранить
        </Button>
        <Button asChild variant="secondary">
          <Link to="/profile/$username" params={{ username: user.username }}>
            Открыть публичный профиль
          </Link>
        </Button>
      </div>
    </SettingsSectionCard>
  );
}

function SettingsField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-4">
      <Label className="text-muted text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function SecuritySection({ token }: { token: string }) {
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
    <SettingsSectionCard
      title="Безопасность"
      description="Смена пароля. Забыли пароль? Выйдите и воспользуйтесь восстановлением на экране входа."
    >
      <div className="divide-border divide-y">
        <SettingsField label="Текущий пароль">
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </SettingsField>
        <SettingsField label="Новый пароль">
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </SettingsField>
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      {done ? <p className="text-success text-sm">Пароль обновлён.</p> : null}
      <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
        Обновить пароль
      </Button>
    </SettingsSectionCard>
  );
}

function AppearanceSection() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const options: Array<{ id: ThemeMode; label: string; hint: string }> = [
    { id: 'system', label: 'Как в системе', hint: 'Следует настройкам устройства' },
    { id: 'light', label: 'Светлая', hint: 'Светлый фон и контрастные карточки' },
    { id: 'dark', label: 'Тёмная', hint: 'Комфортно вечером' },
  ];

  return (
    <SettingsSectionCard
      title="Оформление"
      description="Тема интерфейса сохраняется на этом устройстве."
    >
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={cn(
              'border-border hover:bg-surface-secondary flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
              theme === option.id && 'border-primary bg-primary/5',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                theme === option.id ? 'border-primary bg-primary' : 'border-border',
              )}
            >
              {theme === option.id ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <span>
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="text-muted block text-xs">{option.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </SettingsSectionCard>
  );
}

function DevicesSection({
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
    <SettingsSectionCard
      title="Устройства"
      description="Активные входы в аккаунт. Завершите сессии, если видите незнакомое устройство."
    >
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
          Выйти на этом устройстве
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
    </SettingsSectionCard>
  );
}
