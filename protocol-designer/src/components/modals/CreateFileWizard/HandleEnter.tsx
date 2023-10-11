import * as React from 'react'
import { HandleKeypress } from '@opentrons/components'

interface HandleEnterProps {
  children: React.ReactNode
  onEnter: () => void
  disabled?: boolean
}

export function HandleEnter(props: HandleEnterProps): JSX.Element {
  const { children, onEnter, disabled } = props

  if (disabled) {
    return <div>{children}</div>
  }

  return (
    <HandleKeypress
      preventDefault
      handlers={[
        {
          key: 'Enter',
          shiftKey: false,
          onPress: onEnter,
        },
      ]}
    >
      {children}
    </HandleKeypress>
  )
}
