import { shell } from 'electron'

import { createLogger } from './log'

const PROTOCOL_NAME = 'com-opentrons-ot2-app'

// ToDo update the link later
export const OT2_APP_DOWNLOAD_PAGE = 'https://opentrons.com/ot-app'

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

  try {
    await shell.openExternal(url)
  } catch {
    log.debug('OT-2 App is not installed and open the download page')
    await shell.openExternal(OT2_APP_DOWNLOAD_PAGE)
  }
}
