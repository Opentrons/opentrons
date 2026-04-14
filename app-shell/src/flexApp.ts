import { shell } from 'electron'

import { createLogger } from './log'

const PROTOCOL_NAME = 'com-opentrons-flex-app'

export const FLEX_APP_DOWNLOAD_PAGE = 'https://opentrons.com/ot-app'

const log = createLogger('flex-app')

export async function openFlexAppExternal(payload?: {
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
    log.debug('Flex App is not installed and open the download page')
    await shell.openExternal(FLEX_APP_DOWNLOAD_PAGE)
  }
}
