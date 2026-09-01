import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { AppConfig } from '../../config/env.js';

export type EmailSender = {
  sendVerificationCode(input: { to: string; code: string }): Promise<void>;
};

export class ConsoleEmailSender implements EmailSender {
  constructor(private readonly log: (payload: Record<string, unknown>, message: string) => void) {}

  async sendVerificationCode(input: { to: string; code: string }) {
    this.log({ to: input.to, code: input.code }, 'email verification code sent');
  }
}

export class SmtpEmailSender implements EmailSender {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string,
  ) {}

  async sendVerificationCode(input: { to: string; code: string }) {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Код подтверждения — Купилко',
      text: `Ваш код подтверждения: ${input.code}\n\nКод действует 15 минут. Если вы не регистрировались на Купилко, просто проигнорируйте это письмо.`,
      html: `<p>Ваш код подтверждения:</p><p style="font-size:24px;font-weight:700;letter-spacing:0.2em">${input.code}</p><p>Код действует 15 минут. Если вы не регистрировались на Купилко, просто проигнорируйте это письмо.</p>`,
    });
  }
}

export function createEmailSender(
  config: AppConfig,
  log: (payload: Record<string, unknown>, message: string) => void,
): EmailSender {
  if (config.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth:
        config.SMTP_USER && config.SMTP_PASS
          ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
          : undefined,
    });
    return new SmtpEmailSender(transporter, config.EMAIL_FROM);
  }

  return new ConsoleEmailSender(log);
}
