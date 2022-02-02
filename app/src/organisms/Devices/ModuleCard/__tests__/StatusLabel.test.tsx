import { C_BLUE, C_SKY_BLUE, renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { StatusLabel } from '../StatusLabel'

const render = (props: React.ComponentProps<typeof StatusLabel>) => {
  return renderWithProviders(<StatusLabel {...props} />)[0]
}

describe('StatusLabel', () => {
  let props: React.ComponentProps<typeof StatusLabel>

  it('renders an engaged status label with a blue background and text', () => {
    props = {
      moduleStatus: 'Engaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    getByText('Engaged')
  })

  it('renders a disengaged status label with a blue background and text', () => {
    props = {
      moduleStatus: 'Disengaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    getByText('Disengaged')
  })
})
