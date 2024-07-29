import * as React from 'react'
import { useSelector } from 'react-redux'

import { getUserId } from '../../../redux/config'
import {
  useClientDataRecovery,
  useUpdateClientDataRecovery,
} from '../../../resources/client_data'

import type { ClientDataRecovery } from '../../../resources/client_data'

const CLIENT_DATA_INTERVAL_MS = 5000

/**
 * A client is the active user when actively engaging in Error Recovery (ex, clicking an option from the splash screen).
 * An active user may be made inactive through three methods:
 * 1) If a different client revokes the active user status (ex "terminate remote activity").
 * In this instance, the client will not be the active user, but may *not* see a takeover modal if a different user has
 * yet to become the active user.
 * 2) The client yields their active status by returning to the splash page (the client is not actively using error recovery).
 * 3) Completing a recovery flow.
 *
 * A client claims the active user status via a CTA, and then informs other clients of their active user status.
 */
export function useRecoveryTakeover(
  toggleERWiz: (launchER: boolean) => Promise<void>
): {
  /* Whether to show the takeover modal. */
  showTakeover: boolean
  /* Whether the user is permitted to enter *any* ER flows, including the cancel flow. */
  isActiveUser: boolean
  /* Wraps toggleERWiz with the ability to claim immediate active user status and inform the network of the client's active user status. */
  toggleERWizAsActiveUser: (launchER: boolean) => Promise<void>
  /* Indicates the active user's recovery intent. */
  intent: ClientDataRecovery['intent']
} {
  const [isActiveUser, setIsActiveUser] = React.useState(false)

  const thisUserId = useSelector(getUserId)
  const { userId: activeId, intent } = useClientDataRecovery({
    refetchInterval: CLIENT_DATA_INTERVAL_MS,
  })
  const { updateWithIntent, clearClientData } = useUpdateClientDataRecovery()

  const showTakeover = !(activeId == null || thisUserId === activeId)

  const toggleERWizAsActiveUser = (launchER: boolean): Promise<void> => {
    const newIsActiveUser = !isActiveUser
    setIsActiveUser(newIsActiveUser)

    if (newIsActiveUser) {
      const intent: ClientDataRecovery['intent'] = launchER
        ? 'recovering'
        : 'canceling'

      updateWithIntent(intent)
    }
    // If the client is in a takeover and then presses "go back" enough to get back to the splash, revoke the client's active status.
    else if (isActiveUser && !newIsActiveUser) {
      clearClientData()
    }

    return toggleERWiz(launchER)
  }

  // Update the client's active user status implicitly if revoked by a different client.
  React.useEffect(() => {
    if (isActiveUser && activeId !== thisUserId) {
      setIsActiveUser(false)
    }
  }, [activeId]) // Not all dependencies added for intended behavior!

  return {
    showTakeover,
    intent,
    toggleERWizAsActiveUser,
    isActiveUser,
  }
}
