// mock portal for tests
import * as React from 'react'
interface Props {
  children: React.ReactNode
}
// replace Portal with a pass-through React.Fragment
export const Portal = ({ children }: Props): JSX.Element => <>{children}</>
