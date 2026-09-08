import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
import { isUpdatesWritePermissionError } from '/app/local-resources/access-control/utils'
import {
  clearRobotUpdateSession,
  unexpectedRobotUpdateError,
} from '/app/redux/robot-update'

import type { Dispatch } from '/app/redux/types'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function reportRobotUpdateFlowError(
  dispatch: Dispatch,
  error: unknown
): void {
  if (isAbortError(error)) {
    return
  }
  if (isUpdatesWritePermissionError(error)) {
    dispatch(clearRobotUpdateSession())
    return
  }
  if (isDocumentedMutationError(error) === true) {
    // access_control_loading is retried in createUpdateSession; if it still
    // surfaces here, keep the session so the UI does not silently disappear.
    if (error.type === 'access_control_loading') {
      dispatch(
        unexpectedRobotUpdateError(
          i18n.t('unable_to_start_update_session', { ns: 'device_settings' })
        )
      )
      return
    }
    // base case, the user backed out.
    dispatch(clearRobotUpdateSession())
    return
  }
  const message =
    error instanceof Error
      ? error.message
      : i18n.t('unable_to_start_update_session', { ns: 'device_settings' })
  dispatch(unexpectedRobotUpdateError(message))
}
