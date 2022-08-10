import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { Line } from '../index'

const render = (props: React.ComponentProps<typeof Line>) => {
  return renderWithProviders(<Line {...props} />)[0]
}

describe('Line', () => {
  let props: React.ComponentProps<typeof Line>
})
