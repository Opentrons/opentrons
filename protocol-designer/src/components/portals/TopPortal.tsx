import * as React from 'react'

const PORTAL_ROOT_ID = 'top-portal-root'

export const getTopPortalEl = (): HTMLElement => document.getElementById(PORTAL_ROOT_ID) ?? document.body

export function PortalRoot(): JSX.Element {
  return <div id={PORTAL_ROOT_ID} />
}