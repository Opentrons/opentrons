import * as React from 'react'
import { HandleKeypress } from '@opentrons/components'

interface HandleEnterProps {
  children: React.ReactNode
  onEnter: () => void
}

export function HandleEnter(props: HandleEnterProps): JSX.Element {
  const { children, onEnter } = props

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
