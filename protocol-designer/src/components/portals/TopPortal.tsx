// @flow
import * as React from 'react'
import ReactDom from 'react-dom'

const PORTAL_ROOT_ID = 'top-portal-root'

export function PortalRoot(): React.Node {
  return <div id={PORTAL_ROOT_ID} />
}

export function getPortalElem(): HTMLElement | null {
  return document.getElementById(PORTAL_ROOT_ID)
}

type Props = { children: React.Node }

/** The children of Portal are rendered into the
 * PortalRoot, if the PortalRoot exists in the DOM */
export function Portal(props: Props): React.Node {
  const modalRootElem = getPortalElem()

  if (!modalRootElem) {
    console.error('TopPortal root is not present, could not render modal')
    return null
  }

  return ReactDom.createPortal(props.children, modalRootElem)
}
