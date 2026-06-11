import { useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { LoggedOutOverlay } from '/app/molecules/LoggedOutOverlay'

import { useShouldShowLoggedOutOverlay } from './hooks/useShouldShowLoggedOutOverlay'
import { showLoginModal, useIsLoginModalOpen } from './LoginModal'

export function LoggedOutOverlayMount(): JSX.Element | null {
  const queryClient = useQueryClient()
  const host = useHost()
  const isLoginModalOpen = useIsLoginModalOpen()
  const shouldShow = useShouldShowLoggedOutOverlay(isLoginModalOpen)
  if (!shouldShow) {
    return null
  }
  return (
    <LoggedOutOverlay
      onClick={() => {
        void showLoginModal(queryClient, host ?? null)
      }}
    />
  )
}
