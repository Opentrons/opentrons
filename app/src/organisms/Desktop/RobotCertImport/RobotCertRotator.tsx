import { Fragment } from 'react'

import { useRotateRobotCerts } from './useRotateRobotCerts'

import type { ReactNode } from 'react'

export interface RobotCertRotatorProps {
  children: ReactNode
}

export function RobotCertRotator({
  children,
}: RobotCertRotatorProps): ReactNode {
  useRotateRobotCerts()
  return <Fragment>{children}</Fragment>
}
