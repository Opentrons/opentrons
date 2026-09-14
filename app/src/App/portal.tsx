/**
 * Portals in which to render modals, overlays, etc.
 *
 * The "modal portal" is for things that should NOT occlude global navigation
 * in the desktop app. Generally, these are things that the user is allowed to dismiss
 * or navigate away from, or things that are scoped to a specific robot.
 *
 * The "top portal" is for things that SHOULD occlude global navigation
 * in the desktop app.
 *
 * On the on-device display, there is no such distinction. By convention, ODD-only
 * things should use the top portal.
 */

import { Box } from '@opentrons/components'

import type { ReactNode } from 'react'

export const MODAL_PORTAL_ID = '__otAppModalPortalRoot'
export const TOP_PORTAL_ID = '__otAppTopPortalRoot'

export function getModalPortalEl(): HTMLElement {
  return global.document.getElementById(MODAL_PORTAL_ID) ?? global.document.body
}

export function getTopPortalEl(): HTMLElement {
  return global.document.getElementById(TOP_PORTAL_ID) ?? global.document.body
}

export function ModalPortalRoot(): ReactNode {
  return <Box zIndex={1} id={MODAL_PORTAL_ID} data-testid={MODAL_PORTAL_ID} />
}

export function TopPortalRoot(): ReactNode {
  return <Box zIndex={10} id={TOP_PORTAL_ID} data-testid={TOP_PORTAL_ID} />
}
