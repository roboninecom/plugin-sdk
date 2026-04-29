export const translations = {
  en: {
    title: 'Hello robot',
    connectPrompt: 'Connect your robot to get started.',
    connectButton: 'Connect robot',
    greeting: 'Hello! Your robot is connected and ready.',
    jointCount: (n: number) => `${n} joint${n === 1 ? '' : 's'} available`,
  },
  ru: {
    title: 'Привет, робот',
    connectPrompt: 'Подключите робота, чтобы начать.',
    connectButton: 'Подключить робота',
    greeting: 'Привет! Ваш робот подключён и готов к работе.',
    jointCount: (n: number) => `Доступно суставов: ${n}`,
  },
} satisfies Record<string, Record<string, string | ((...args: never[]) => string)>>
