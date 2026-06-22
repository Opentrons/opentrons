import { LoggedOutOverlay } from '/app/molecules/LoggedOutOverlay'

import { useShouldShowLoggedOutOverlay } from './hooks/useShouldShowLoggedOutOverlay'
import { showLoginModal, useIsLoginModalOpen } from './LoginModal'

export function LoggedOutOverlayMount(): JSX.Element | null {
  const isLoginModalOpen = useIsLoginModalOpen()
  const shouldShow = useShouldShowLoggedOutOverlay(isLoginModalOpen)
  if (!shouldShow) {
    return null
  }
  return (
    <LoggedOutOverlay
      onClick={() => {
        void showLoginModal()
      }}
    />
  )
}
