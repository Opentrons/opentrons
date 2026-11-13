// mock portal for enzyme tests
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

// replace Portal with a pass-through React.Fragment
export const Portal = ({ children }: Props): ReactNode => <>{children}</>

export const PortalRoot = (): ReactNode => <></>
export const TopPortalRoot = (): ReactNode => <></>
