import { Box } from '@opentrons/components'

const PORTAL_ROOT_ID = 'top-portal-root'

export const getTopPortalEl = (): HTMLElement =>
  document.getElementById(PORTAL_ROOT_ID) ?? document.body

export function PortalRoot(): JSX.Element {
  return <Box id={PORTAL_ROOT_ID} />
}
