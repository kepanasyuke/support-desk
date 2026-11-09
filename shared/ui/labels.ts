const CHANNELS: Record<string, string> = {
  email: "Почта",
  chat: "Чат",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  vk: "VK",
};

export function channelLabel(value: string): string {
  return CHANNELS[value] ?? value;
}
