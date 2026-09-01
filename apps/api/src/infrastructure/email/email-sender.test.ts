import { describe, expect, it, vi } from 'vitest';
import { ConsoleEmailSender, SmtpEmailSender } from './email-sender.js';

describe('ConsoleEmailSender', () => {
  it('logs verification code payload', async () => {
    const log = vi.fn();
    const sender = new ConsoleEmailSender(log);
    await sender.sendVerificationCode({ to: 'user@example.com', code: '123456' });
    expect(log).toHaveBeenCalledWith(
      { to: 'user@example.com', code: '123456' },
      'email verification code sent',
    );
  });

  it('logs password reset code payload', async () => {
    const log = vi.fn();
    const sender = new ConsoleEmailSender(log);
    await sender.sendPasswordResetCode({ to: 'user@example.com', code: '654321' });
    expect(log).toHaveBeenCalledWith(
      { to: 'user@example.com', code: '654321' },
      'password reset code sent',
    );
  });
});

describe('SmtpEmailSender', () => {
  it('sends verification email through transporter', async () => {
    const sendMail = vi.fn(async () => ({ messageId: 'msg-1' }));
    const sender = new SmtpEmailSender({ sendMail } as never, 'noreply@kupilko.store');
    await sender.sendVerificationCode({ to: 'user@example.com', code: '654321' });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@kupilko.store',
        to: 'user@example.com',
        subject: 'Код подтверждения — Купилко',
      }),
    );
  });
});
