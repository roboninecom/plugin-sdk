import type { PluginManifest } from '@robonine/plugin-sdk'

export const manifest: PluginManifest = {
  sdkVersion: '1',
  vendor: 'your-name',
  slug: 'hello-robot',
  name: {
    en: 'Hello robot',
    ru: 'Привет, робот',
  },
  description: {
    en: 'A minimal example plugin that greets your robot.',
    ru: 'Минимальный пример плагина, который приветствует вашего робота.',
  },
  icon: 'Bot',
  scopes: [],
}
