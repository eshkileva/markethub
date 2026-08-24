export function mapAuthError(message: string) {
  if (message === 'Email already registered') return 'Этот email уже занят';
  if (message === 'Username already taken') return 'Этот ник уже занят';
  if (message === 'Invalid email or password') return 'Неверный email или пароль';
  if (message === 'Unauthorized') return 'Нужно войти заново';
  if (message === 'Session expired') return 'Сессия истекла, войдите снова';
  return message;
}
