export function mapAuthError(message: string) {
  if (message === 'Email already registered') return 'Этот email уже занят';
  if (message === 'Username already taken') return 'Этот ник уже занят';
  if (message === 'Invalid email or password') return 'Неверный email или пароль';
  if (message === 'Unauthorized') return 'Нужно войти заново';
  if (message === 'Session expired') return 'Сессия истекла, войдите снова';
  if (message === 'Email уже подтверждён') return message;
  if (message === 'Код не найден. Запросите новый.') return message;
  if (message === 'Срок действия кода истёк. Запросите новый.') return message;
  if (message === 'Слишком много попыток. Запросите новый код.') return message;
  if (message === 'Неверный код') return message;
  if (message === 'Подождите минуту перед повторной отправкой') return message;
  if (message === 'Подтвердите email, чтобы продолжить') return message;
  return message;
}
