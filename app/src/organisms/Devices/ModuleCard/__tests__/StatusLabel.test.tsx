import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { StatusLabel } from '../StatusLabel'

import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'

const render = (props: React.ComponentProps<typeof StatusLabel>) => {
  return renderWithProviders(<StatusLabel {...props} />)[0]
}

describe('StatusLabel', () => {
  let props: React.ComponentProps<typeof StatusLabel>

  it('renders an engaged status', () => {
    props = {
      moduleType: mockMagneticModule.type,
      moduleStatus: 'Engaged',
    }
    const { getByText } = render(props)
    getByText('Engaged')
  })

  it('renders a disengaged status', () => {
    props = {
      moduleType: mockMagneticModule.type,
      moduleStatus: 'Disengaged',
    }
    const { getByText } = render(props)
    getByText('Disengaged')
  })
})
