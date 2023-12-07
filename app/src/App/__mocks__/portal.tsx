// mock portal for enzyme tests
import * as React from 'react'

interface Props {
  children: React.ReactNode
}

// replace Portal with a pass-through React.Fragment
export const Portal = ({ children }: Props): JSX.Element => <>{children}</>

export const PortalRoot = (): JSX.Element => <></>
export const TopPortalRoot = (): JSX.Element => <></>
