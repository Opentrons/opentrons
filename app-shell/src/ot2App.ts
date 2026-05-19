import { app, shell } from 'electron'

import { createLogger } from './log'

const PROTOCOL_NAME = 'com-opentrons-ot2-app'

// ToDo update the link later
export const OT2_APP_DOWNLOAD_PAGE = 'https://opentrons.com/app'

const log = createLogger('ot2-app')

export async function openOT2AppExternal(payload?: {
  filePath?: string
}): Promise<void> {
  const params = new URLSearchParams()
  if (payload?.filePath != null) {
    params.set('filePath', payload.filePath)
  }

  const url =
    params.size > 0
      ? `${PROTOCOL_NAME}://open?${params.toString()}`
      : `${PROTOCOL_NAME}://open`

  const appName = app.getApplicationNameForProtocol(url)

  // "Electron" means a stale dev-mode registration, not the actual Flex app
  if (appName === '' || appName === 'Electron') {
    try {
      await shell.openExternal(OT2_APP_DOWNLOAD_PAGE)
    } catch (error) {
      log.error(
        'Failed to open OT-2 App download page',
        error instanceof Error ? error.message : String(error)
      )
    }
    return
  }

  try {
    await shell.openExternal(url)
  } catch (error) {
    log.error(
      'Failed to open OT-2 App external URL',
      error instanceof Error ? error.message : String(error)
    )
  }
}
