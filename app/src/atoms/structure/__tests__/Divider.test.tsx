import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { Divider } from '../index'

const render = (props: React.ComponentProps<typeof Divider>) => {
  return renderWithProviders(<Divider {...props} />)[0]
}

describe('Divider', () => {
  let props: React.ComponentProps<typeof Divider>

  beforeEach(() => {
    props = {
      width: '80%',
      marginY: '0',
    }
  })

  it('renders divider', () => {})
})
