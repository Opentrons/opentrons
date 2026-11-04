/* eslint-disable opentrons/no-direct-mutating */
import { createLiveCommand, setLights, shutdown } from '@opentrons/api-client'
import { useDocumentedMutation, useHost } from '@opentrons/react-api-client'

import type { UseMutationResult } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

/**
 * Shut down the robot, and also turn off the lights. (I guess because the lights
 * would otherwise be stuck on after the software shuts down?)
 */
export function useFullShutdownMutation(
  documentationState: DocumentationState
): UseMutationResult<void, unknown, void, unknown> {
  const host = useHost()
  return useDocumentedMutation(
    documentationState,
    ['shutdown_robot'],
    ({ userNotes }) => fullShutdown(host!, userNotes)
  )
}

async function fullShutdown(
  host: HostConfig,
  userNotes: string
): Promise<void> {
  try {
    await setLights(host, { on: false }, userNotes)
  } catch (e) {
    console.warn('Unable to set lights before shutdown.', e)
  }
  try {
    await createLiveCommand(
      host,
      { commandType: 'setStatusBar', params: { animation: 'off' } },
      { waitUntilComplete: true, timeout: 10 * 1000 },
      userNotes
    )
  } catch (e) {
    console.warn('Unable to turn off status bar before shutdown.', e)
  }

  await shutdown(host, userNotes)
}
