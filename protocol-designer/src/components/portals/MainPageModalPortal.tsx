import * as React from 'react'
import ReactDom from 'react-dom'

const PORTAL_ROOT_ID = 'main-page-modal-portal-root'

export const getMainPagePortalEl = (): HTMLElement => document.getElementById(PORTAL_ROOT_ID) ?? document.body

export function PortalRoot(): JSX.Element {
  return <div id={PORTAL_ROOT_ID} />
}

interface Props {
  children: React.ReactNode
}

/** The children of Portal are rendered into the
 * PortalRoot, if the PortalRoot exists in the DOM */
export function Portal(props: Props): JSX.Element | null {
  const modalRootElem = getMainPagePortalEl()

  if (modalRootElem == null) {
    console.error('Confirm Modal root is not present, could not render modal')
    return null
  }

  return ReactDom.createPortal(props.children, modalRootElem)
}
