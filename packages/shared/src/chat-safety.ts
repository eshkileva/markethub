export type ScamFlag = {
  id: string;
  message: string;
};

const SCAM_RULES: Array<{ id: string; pattern: RegExp; message: string }> = [
  {
    id: 'prepay',
    pattern: /предоплат|задаток|аванс|залог.*перев|перевед(и|ите).*(на карту|на счёт|на счет)/iu,
    message: 'Осторожно: просьба предоплаты или перевода на карту — частый признак мошенничества.',
  },
  {
    id: 'external_payment',
    pattern: /(qiwi|киви|webmoney|вебмани|paypal|payeer|crypto|крипт|usdt|btc)/iu,
    message: 'Осторожно: перевод на сторонний платёжный сервис вне площадки.',
  },
  {
    id: 'external_link',
    pattern: /https?:\/\/[^\s]+/iu,
    message:
      'Осторожно: ссылка в сообщении. Не переходите по незнакомым ссылкам и не вводите данные карты.',
  },
  {
    id: 'off_platform',
    pattern: /(telegram|телеграм|whatsapp|вотсап|viber|вайбер).*(напиш|пиш|перейд)/iu,
    message: 'Осторожно: перевод общения на другой мессенджер повышает риск обмана.',
  },
  {
    id: 'urgency',
    pattern: /(срочно|только сегодня|осталось мест|успей).*(оплат|перевед|скинь)/iu,
    message: 'Осторожно: давление «срочно оплатить» — типичный приём мошенников.',
  },
];

export const SAFE_DEAL_TIPS = [
  'Встречайтесь лично и проверяйте товар перед оплатой.',
  'Не переводите предоплату незнакомому продавцу.',
  'Сохраняйте переписку до завершения сделки.',
];

export function scanMessageForScam(body: string): ScamFlag[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  const flags: ScamFlag[] = [];
  for (const rule of SCAM_RULES) {
    if (rule.pattern.test(trimmed)) {
      flags.push({ id: rule.id, message: rule.message });
    }
  }
  return flags;
}
