# Robonine Plugin SDK

<div align="center">

[English](README.md) | **中文** | [Русский](README.ru.md)

</div>

本仓库包含用于构建 [Robonine](https://robonine.com) 教育机器人平台插件的 TypeScript 类型定义和工具链。

插件是运行在平台内部的 React 组件，可直接访问机器人。你只需编写一个组件，声明所需的硬件权限，打包源文件并提交审核。审核通过后，你的插件将出现在所有用户的插件市场中。

## 快速开始

**1. 复制示例插件。**

```
cp -r sample-plugin my-plugin
cd my-plugin
```

**2. 安装类型依赖**（用于编辑器支持和类型检查——运行时无需这些依赖）。

```
npm install
```

添加指向 SDK 的 `package.json`：

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

**3. 编辑 `src/manifest.ts`** — 设置你的 `vendor`（小写、URL 安全的名称，代表你或你的组织）、`slug`（插件唯一名称）、可读的 `name`、`description` 以及插件所需的 `scopes`。

**4. 在 `src/plugin.tsx` 中编写组件。** 导出一个接受 `{ context: PluginContext }` 的 `PluginRoot` 函数。使用 `context.ui.*` 获取平台风格的 UI 组件，使用 `context.servo.*` API 控制机器人（见下方 [PluginContext](#plugincontext)）。

**5. 本地测试。** 打包 `src/` 目录的内容（文件位于压缩包根目录，不含 `src/` 前缀）：

```
(cd src && zip -r ../my-plugin.robo9 .)
```

打开[工具页面](https://robonine.com/tools)，点击**本地加载…**，选择该文件。插件将立即加载——无需账号，但部分 API（例如需要 `user.auth` scope 的接口）仍然需要登录。

**6. 提交。** 插件准备好后，在工具页面点击 **提交审核**，附上同一个 `.robo9` 文件。团队将审查源代码，审核通过后发布到插件市场。

---

## 插件工作原理

插件是一小组 TypeScript/React 源文件。平台在运行时编译并加载它。你的组件会收到一个 `context` 对象——这是全部可用的 API 接口，无法访问此范围之外的平台内部状态。

```
your-plugin/
└── src/
    ├── index.ts        ← 导出 manifest 和 PluginRoot
    ├── manifest.ts     ← 插件元数据和权限声明
    ├── plugin.tsx      ← React 组件（PluginRoot）
    └── translations.ts ← 本地化字符串（至少需要 en + ru）
```

### Manifest（清单）

清单告诉平台你是谁、你的插件做什么以及需要什么硬件。

```ts
import type { PluginManifest } from '@robonine/plugin-sdk'

export const manifest: PluginManifest = {
  sdkVersion: '1',
  vendor: 'your-name',       // 小写、URL 安全——你的唯一命名空间
  slug: 'my-plugin',         // 小写、URL 安全——在你的命名空间内唯一
  name: { en: 'My plugin', ru: 'Мой плагин', zh: '我的插件' },
  description: { en: 'What it does.', ru: 'Что делает.', zh: '功能描述。' },
  icon: 'Wrench',            // Lucide 图标名称或内联 SVG 字符串
  scopes: ['robot.control'], // 插件所需权限（见下方 Scopes）
}
```

### Scopes（权限）

Scopes 是权限声明。平台强制执行它们：未声明的 API 在运行时不会出现在 `context` 对象中，用户在加载插件前会看到权限摘要。

| Scope | 授予的权限 |
|---|---|
| *(无)* | 纯 UI 插件——无硬件访问 |
| `robot.read` | 读取舵机原始位置和寄存器值 |
| `robot.control` | 发送位置命令和控制速度（隐含 `robot.read`） |
| `robot.calibration` | 向电机 EEPROM 写入校准数据和归零偏移量 |
| `robot.config` | 写入低级舵机配置（如舵机 ID）——破坏性操作，总线上只能有一个舵机 |
| `robot.leader` | 第二个独立机器人连接（双臂配置中的主臂） |
| `robot.local` | 需要物理在场——在连接对话框中禁用 WebRTC 传输 |
| `robot.saved` | 需要已保存的机器人配置而非通用型号；在连接对话框中隐藏"型号"选项 |
| `camera.read` | 访问摄像头画面 |
| `install` | 使插件可安装；允许通过 `PluginService` 导出后台服务 |
| `user.auth` | 要求用户登录 |
| `user.profile` | 读取用户姓名和邮箱 |
| `user.read` | 通过 `listUserRobots()`、`listUserPaths()` 和 `readPath()` 读取用户保存的机器人和运动轨迹 |

### PluginContext

`context` prop 是组件可用的完整 API 接口。

```ts
context.locale              // 当前语言环境字符串（'en'、'ru' 等）
context.connection          // { connected: boolean }
context.openConnectDialog() // 打开机器人连接对话框
context.showSafetyWarning() // 显示标准安全提示（任何运动前必须调用）

// 机器人 API（需要相应的 scope）
context.servo.setPosition(id, value)
context.servo.syncSetPositions([{ id, position }, …])
context.robotConfig         // 关节→舵机映射，编码器辅助工具

// UI 原语（平台风格）
context.ui.Button
context.ui.Input
context.ui.Slider

// 3D 可视化
context.WorldView           // 支持 ref 转发的 React 组件
```

### 翻译

将本地化字符串保存在 `translations.ts` 文件中，并在组件中通过 `useMemo` 选择正确的语言。

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

## 示例插件

一个完整的最小化插件位于 [`sample-plugin/`](./sample-plugin/)。它没有硬件 scope——这是一个纯 UI 插件，演示了标准文件结构以及已连接/未连接状态模式。

如需真实案例，请参阅 [Robonine 官方插件](https://github.com/roboninecom/lab-plugins)。

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

## 提交插件

插件准备好后，打包 `src/` 目录并通过平台内的**提交审核**对话框提交（工具页面 → 提交审核）。压缩包只能包含 `.ts`、`.tsx`、`.js` 和 `.jsx` 文件。

审核团队将检查源代码，确认安全性和质量，审核通过后将插件添加到插件市场。
