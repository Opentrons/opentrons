import { Box } from '@opentrons/components'

export const TOP_PORTAL_ID = '__otAppTopPortalRoot'
export const MODAL_PORTAL_ID = '__otAppModalPortalRoot'
export function getTopPortalEl(): HTMLElement {
  return global.document.getElementById(TOP_PORTAL_ID) ?? global.document.body
}
export function getModalPortalEl(): HTMLElement {
  return global.document.getElementById(MODAL_PORTAL_ID) ?? global.document.body
}

export function PortalRoot(): JSX.Element {
  return <Box zIndex={1} id={MODAL_PORTAL_ID} data-testid={MODAL_PORTAL_ID} />
}

export function TopPortalRoot(): JSX.Element {
  return <Box zIndex={10} id={TOP_PORTAL_ID} data-testid={TOP_PORTAL_ID} />
}
