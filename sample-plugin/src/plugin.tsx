import type { JointInfo, PluginContext } from '@robonine/plugin-sdk'
import { useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

interface Props {
  context: PluginContext
}

export function PluginRoot({ context }: Props) {
  const t = useMemo(() => translations[context.locale as keyof typeof translations] ?? translations.en, [context.locale])
  const [joints, setJoints] = useState<JointInfo[]>([])

  useEffect(() => {
    if (!context.connection.connected) {
      setJoints([])
    }
  }, [context.connection.connected])

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
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <p className="text-sm">{t.greeting}</p>
          <context.WorldView onLoad={setJoints} />
          <p className="text-xs text-muted-foreground">{t.jointCount(joints.length)}</p>
        </div>
      </div>
    </div>
  )
}
