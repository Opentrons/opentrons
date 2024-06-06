import * as React from 'react'

import styles from './styles.module.css'

export interface ControlInfoProps {
  children: React.ReactNode
  className?: string
}

export function ControlInfo(props: ControlInfoProps): JSX.Element {
  const { children, className = styles.control_info } = props
  return <div className={className}>{children}</div>
}
