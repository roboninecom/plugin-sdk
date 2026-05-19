# Robonine Plugin SDK

<div align="center">

[English](README.md) | [中文](README.zh-CN.md) | **Русский**

</div>

Этот репозиторий содержит определения TypeScript-типов и инструменты для создания плагинов для образовательной робототехнической платформы [Robonine](https://robonine.com).

Плагины — это React-компоненты, которые запускаются внутри платформы и получают прямой доступ к роботу. Вы пишете компонент, объявляете необходимые аппаратные возможности, архивируете исходные файлы и отправляете на проверку. После одобрения плагин появляется в маркетплейсе для всех пользователей.

## Быстрый старт

**1. Скопируйте пример плагина.**

```
cp -r sample-plugin my-plugin
cd my-plugin
```

**2. Установите типовые зависимости** (для поддержки редактора и проверки типов — не нужны во время выполнения).

```
npm install
```

Добавьте `package.json`, указывающий на SDK:

```json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "@robonine/plugin-sdk": "file:../",
    "react": "^19"
  },
  "devDependencies": {
    "@types/react": "^19",
    "typescript": "^5"
  }
}
```

**3. Отредактируйте `src/manifest.ts`** — укажите `vendor` (ваше уникальное имя в нижнем регистре, допустимое в URL), `slug` (уникальное имя плагина), человекочитаемые `name`, `description` и нужные `scopes`.

**4. Напишите компонент в `src/plugin.tsx`.** Экспортируйте функцию `PluginRoot`, принимающую `{ context: PluginContext }`. Используйте `context.ui.*` для UI-компонентов платформы и `context.servo.*` для управления роботом (см. [PluginContext](#plugincontext) ниже).

**5. Локальное тестирование.** Упакуйте содержимое `src/` (файлы в корне архива, без папки `src/`):

```
(cd src && zip -r ../my-plugin.robo9 .)
```

Откройте [страницу инструментов](https://robonine.com/tools), нажмите **Загрузить локально…** и выберите файл. Плагин загружается сразу — аккаунт не нужен, хотя некоторые API (например, требующие scope `user.auth`) всё равно потребуют входа в систему.

**6. Отправка.** Когда плагин готов, откройте Инструменты → **Отправить на проверку**. Прикрепите тот же файл `.robo9`. Команда проверит исходный код и опубликует плагин в маркетплейсе после одобрения.

---

## Как работают плагины

Плагин — это небольшой набор TypeScript/React-файлов. Платформа компилирует и загружает его во время выполнения. Ваш компонент получает объект `context` — это вся доступная поверхность API. Доступ ко внутреннему состоянию платформы за его пределами отсутствует.

```
your-plugin/
└── src/
    ├── index.ts        ← экспортирует manifest и PluginRoot
    ├── manifest.ts     ← метаданные и объявления возможностей
    ├── plugin.tsx      ← React-компонент (PluginRoot)
    └── translations.ts ← локализованные строки (минимум en + ru)
```

### Манифест

Манифест сообщает платформе, кто вы, что делает ваш плагин и какое оборудование ему нужно.

```ts
import type { PluginManifest } from '@robonine/plugin-sdk'

export const manifest: PluginManifest = {
  sdkVersion: '1',
  vendor: 'your-name',       // нижний регистр, допустим в URL — ваше уникальное пространство имён
  slug: 'my-plugin',         // нижний регистр, допустим в URL — уникален в вашем пространстве имён
  name: { en: 'My plugin', ru: 'Мой плагин', zh: '我的插件' },
  description: { en: 'What it does.', ru: 'Что делает.', zh: '功能描述。' },
  icon: 'Wrench',            // имя иконки Lucide или строка со встроенным SVG
  scopes: ['robot.control'], // необходимые возможности (см. Scopes ниже)
}
```

### Scopes

Scopes — это объявления возможностей. Платформа их применяет: необъявленные API отсутствуют в объекте `context` во время выполнения, а пользователь видит сводку разрешений перед загрузкой плагина.

| Scope | Что предоставляет |
|---|---|
| *(нет)* | UI-only плагин — без доступа к оборудованию |
| `robot.read` | Чтение сырых позиций сервоприводов и значений регистров |
| `robot.control` | Отправка команд позиции и управление скоростью (включает `robot.read`) |
| `robot.calibration` | Запись данных калибровки и смещений в EEPROM двигателя |
| `robot.config` | Запись низкоуровневой конфигурации (например, ID сервопривода) — деструктивно, на шине должен быть только один сервопривод |
| `robot.leader` | Второе независимое подключение робота (ведущая рука в двуручных конфигурациях) |
| `robot.local` | Требует физического присутствия — отключает WebRTC-транспорт в диалоге подключения |
| `robot.saved` | Требует сохранённый профиль робота вместо универсальной модели; скрывает пункт «Модели» в диалоге подключения |
| `camera.read` | Доступ к видеопотоку камеры |
| `install` | Делает плагин устанавливаемым; позволяет экспортировать фоновый сервис через `PluginService` |
| `user.auth` | Требует входа пользователя в систему |
| `user.profile` | Чтение имени и email пользователя |
| `user.read` | Чтение сохранённых роботов и траекторий движения через `listUserRobots()`, `listUserPaths()` и `readPath()` |

### PluginContext

Проп `context` — полная поверхность API, доступная вашему компоненту.

```ts
context.locale              // активная локаль ('en', 'ru', …)
context.connection          // { connected: boolean }
context.openConnectDialog() // открыть диалог подключения робота
context.showSafetyWarning() // показать стандартное предупреждение безопасности (обязательно перед движением)

// API робота (требуют соответствующего scope)
context.servo.setPosition(id, value)
context.servo.syncSetPositions([{ id, position }, …])
context.robotConfig         // привязка суставов к сервоприводам, вспомогательные функции энкодера

// UI-примитивы (в стиле платформы)
context.ui.Button
context.ui.Input
context.ui.Slider

// 3D-визуализация
context.WorldView           // React-компонент с поддержкой ref
```

### Переводы

Храните локализованные строки в файле `translations.ts` и выбирайте нужную локаль в компоненте через `useMemo`.

```ts
export const translations = {
  en: { title: 'My plugin', … },
  ru: { title: 'Мой плагин', … },
  zh: { title: '我的插件', … },
} satisfies Record<string, Record<string, string>>
```

```tsx
const t = useMemo(
  () => translations[context.locale as keyof typeof translations] ?? translations.en,
  [context.locale],
)
```

---

## Пример плагина

Полный минимальный плагин находится в [`sample-plugin/`](./sample-plugin/). Он не использует hardware-scopes — это UI-only плагин, демонстрирующий стандартную структуру файлов и паттерн состояний подключён/отключён.

Примеры реальных плагинов смотрите в [официальных плагинах Robonine](https://github.com/roboninecom/lab-plugins).

### sample-plugin/src/manifest.ts

```ts
import type { PluginManifest } from '@robonine/plugin-sdk'

export const manifest: PluginManifest = {
  sdkVersion: '1',
  vendor: 'your-name',
  slug: 'hello-robot',
  name: { en: 'Hello robot', ru: 'Привет, робот', zh: '你好，机器人' },
  description: {
    en: 'A minimal example plugin that greets your robot.',
    ru: 'Минимальный пример плагина, который приветствует вашего робота.',
    zh: '一个向机器人打招呼的最小示例插件。',
  },
  icon: 'Bot',
  scopes: [],
}
```

### sample-plugin/src/translations.ts

```ts
export const translations = {
  en: {
    title: 'Hello robot',
    connectPrompt: 'Connect your robot to get started.',
    connectButton: 'Connect robot',
    greeting: 'Hello! Your robot is connected and ready.',
  },
  ru: {
    title: 'Привет, робот',
    connectPrompt: 'Подключите робота, чтобы начать.',
    connectButton: 'Подключить робота',
    greeting: 'Привет! Ваш робот подключён и готов к работе.',
  },
  zh: {
    title: '你好，机器人',
    connectPrompt: '连接机器人以开始使用。',
    connectButton: '连接机器人',
    greeting: '你好！机器人已连接并准备就绪。',
  },
} satisfies Record<string, Record<string, string>>
```

### sample-plugin/src/plugin.tsx

```tsx
import type { PluginContext } from '@robonine/plugin-sdk'
import { translations } from './translations'
import { useMemo } from 'react'

export function PluginRoot({ context }: { context: PluginContext }) {
  const t = useMemo(
    () => translations[context.locale as keyof typeof translations] ?? translations.en,
    [context.locale],
  )

  if (!context.connection.connected) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.connectPrompt}</p>
          <context.ui.Button className="w-full" onClick={context.openConnectDialog}>
            {t.connectButton}
          </context.ui.Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">{t.title}</h1>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm">{t.greeting}</p>
        </div>
      </div>
    </div>
  )
}
```

### sample-plugin/src/index.ts

```ts
export { manifest } from './manifest'
export { PluginRoot } from './plugin'
export { manifest as default } from './manifest'
```

---

## Отправка плагина

Когда плагин готов, упакуйте папку `src/` и отправьте через диалог **Отправить на проверку** внутри платформы (страница Инструменты → Отправить на проверку). Архив должен содержать только файлы `.ts`, `.tsx`, `.js` и `.jsx`.

Команда проверит исходный код, оценит безопасность и качество, и добавит плагин в маркетплейс после одобрения.
