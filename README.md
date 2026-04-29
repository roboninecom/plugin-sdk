# Robonine Plugin SDK

This repository contains the TypeScript type definitions and tooling for building plugins for the [Robonine](https://robonine.com) educational robotics platform.

Plugins are React components that run inside the platform and get direct access to the robot. You write a component, declare what hardware capabilities you need, zip the source files, and submit for review. Once approved, your plugin appears in the marketplace for all users.

## How plugins work

A plugin is a small bundle of TypeScript/React source files. The platform compiles and loads it at runtime. Your component receives a `context` object — that is the entire API surface. There is no access to internal platform state outside of it.

```
your-plugin/
└── src/
    ├── index.ts        ← exports manifest and PluginRoot
    ├── manifest.ts     ← plugin metadata and capability declarations
    ├── plugin.tsx      ← React component (PluginRoot)
    └── translations.ts ← localised strings (en + ru at minimum)
```

### Manifest

The manifest tells the platform who you are, what your plugin does, and what hardware it needs.

```ts
import type { PluginManifest } from '@robonine/plugin-sdk'

export const manifest: PluginManifest = {
  sdkVersion: '1',
  vendor: 'your-name',       // lowercase, URL-safe — your unique namespace
  slug: 'my-plugin',         // lowercase, URL-safe — unique within your namespace
  name: { en: 'My plugin', ru: 'Мой плагин' },
  description: { en: 'What it does.', ru: 'Что делает.' },
  icon: 'Wrench',            // Lucide icon name or inline SVG string
  scopes: ['robot.control'], // capabilities the plugin needs (see Scopes below)
}
```

### Scopes

Scopes are capability declarations. The platform enforces them: undeclared APIs are absent from the `context` object at runtime, and the user sees a permission summary before a plugin loads.

| Scope | What it grants |
|---|---|
| *(none)* | UI-only plugin — no hardware access |
| `robot.read` | Read raw servo positions and register values |
| `robot.control` | Send position commands and control speed (implies `robot.read`) |
| `robot.calibration` | Write calibration data and homing offsets to motor EEPROM |
| `robot.config` | Write low-level servo config (e.g. servo IDs) — destructive, requires one servo on bus |
| `robot.leader` | A second independent robot connection (leader arm in dual-arm setups) |
| `robot.local` | Requires physical presence — disables WebRTC transport in the connect dialog |
| `camera.read` | Access the camera feed |
| `install` | Makes the plugin installable; allows exporting a background service via `PluginService` |
| `user.auth` | Require the user to be signed in |
| `user.profile` | Read the user's name and email |

### PluginContext

The `context` prop is the full API surface your component receives.

```ts
context.locale              // active locale string ('en', 'ru', …)
context.connection          // { connected: boolean }
context.openConnectDialog() // open the robot connection dialog
context.showSafetyWarning() // show the standard safety prompt (required before any motion)

// robot APIs (require matching scope)
context.servo.setPosition(id, value)
context.servo.syncSetPositions([{ id, position }, …])
context.robotConfig         // joint→servo mapping, encoder helpers

// UI primitives (platform-styled)
context.ui.Button
context.ui.Input
context.ui.Slider

// 3D visualisation
context.WorldView           // ref-forwarded React component
```

### Translations

Keep your localised strings in a `translations.ts` file and resolve the right locale in your component via `useMemo`.

```ts
export const translations = {
  en: { title: 'My plugin', … },
  ru: { title: 'Мой плагин', … },
} satisfies Record<string, Record<string, string>>
```

```tsx
const t = useMemo(
  () => translations[context.locale as keyof typeof translations] ?? translations.en,
  [context.locale],
)
```

---

## Example plugin

A complete minimal plugin lives in [`sample-plugin/`](./sample-plugin/). It has no hardware scopes — it is UI-only and demonstrates the standard file structure and the connected/disconnected state pattern.

### sample-plugin/src/manifest.ts

```ts
import type { PluginManifest } from '@robonine/plugin-sdk'

export const manifest: PluginManifest = {
  sdkVersion: '1',
  vendor: 'your-name',
  slug: 'hello-robot',
  name: { en: 'Hello robot', ru: 'Привет, робот' },
  description: {
    en: 'A minimal example plugin that greets your robot.',
    ru: 'Минимальный пример плагина, который приветствует вашего робота.',
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

## Submitting your plugin

When your plugin is ready, zip the `src/` folder and submit it through the **Submit plugin for review** dialog inside the platform (Tools page → Submit for review). Your zip must contain only `.ts`, `.tsx`, `.js`, and `.jsx` files.

The review team will inspect the source, check for safety and quality, and add the plugin to the marketplace once approved.
