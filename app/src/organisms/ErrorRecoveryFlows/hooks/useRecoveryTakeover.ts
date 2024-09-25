import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { getUserId } from '/app/redux/config'
import {
  useClientDataRecovery,
  useUpdateClientDataRecovery,
} from '/app/resources/client_data'

import type { ClientDataRecovery } from '/app/resources/client_data'
import type { UseERWizardResult } from '../ErrorRecoveryWizard'

const CLIENT_DATA_INTERVAL_MS = 5000

export interface UseRecoveryTakeoverResult {
  /* Whether to show the takeover modal. */
  showTakeover: boolean
  /* Whether the user is permitted to enter *any* ER flows, including the cancel flow. */
  isActiveUser: boolean
  /* Wraps toggleERWiz with the ability to claim immediate active user status and inform the network of the client's active user status. */
  toggleERWizAsActiveUser: (
    isActive: boolean,
    launchER: boolean
  ) => Promise<void>
  /* Indicates the active user's recovery intent. */
  intent: ClientDataRecovery['intent']
}

/**
 * A client is the active user when actively engaging in Error Recovery. A client claims the active user status via a CTA
 * (ex, clicking an option from the splash screen), and then informs other clients of their active user status.
 *
 * An active user may be made inactive through three methods:
 * 1) If a different client revokes the active user status (ex "terminate remote activity").
 * In this instance, the client will not be the active user, but may *not* see a takeover modal if a different user has
 * yet to become the active user.
 * 2) The client yields their active status by returning to the splash page (the client is not actively using error recovery).
 * 3) Completing a recovery flow.
 */
export function useRecoveryTakeover(
  toggleERWiz: UseERWizardResult['toggleERWizard']
): UseRecoveryTakeoverResult {
  const [isActiveUser, setIsActiveUser] = useState(false)

  const thisUserId = useSelector(getUserId)
  const { userId: activeId, intent } = useClientDataRecovery({
    refetchInterval: CLIENT_DATA_INTERVAL_MS,
  })
  const { updateWithIntent, clearClientData } = useUpdateClientDataRecovery()

  // Update the client's active user status implicitly if revoked by a different client.
  useEffect(() => {
    if (isActiveUser && activeId !== thisUserId) {
      setIsActiveUser(false)
    }
  }, [activeId]) // Not all dependencies added for intended behavior!

  // If Error Recovery unrenders and this client is the active user, revoke the client's active user status.
  useEffect(() => {
    return () => {
      if (isActiveUser) {
        clearClientData()
      }
    }
  }, [isActiveUser])

  const showTakeover = !(activeId == null || thisUserId === activeId)

  const toggleERWizAsActiveUser = (
    isActive: boolean,
    launchER: boolean
  ): Promise<void> => {
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
      void toggleERWiz(false).then(() => {
        clearClientData()
      })
    }

    return toggleERWiz(isActive, launchER)
  }

  return {
    showTakeover,
    intent,
    toggleERWizAsActiveUser,
    isActiveUser,
  }
}
