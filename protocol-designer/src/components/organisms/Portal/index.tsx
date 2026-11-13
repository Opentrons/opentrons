import type { ReactNode } from 'react'

const PORTAL_ROOT_ID = 'main-page-modal-portal-root'

export const getMainPagePortalEl = (): HTMLElement =>
  document.getElementById(PORTAL_ROOT_ID) ?? document.body

export function PortalRoot(): ReactNode {
  return <div id={PORTAL_ROOT_ID} />
}
