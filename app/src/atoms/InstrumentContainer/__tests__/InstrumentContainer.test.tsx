import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { InstrumentContainer } from '..'

const render = (props: React.ComponentProps<typeof InstrumentContainer>) => {
  return renderWithProviders(<InstrumentContainer {...props} />)[0]
}

describe('InstrumentContainer', () => {
  let props: React.ComponentProps<typeof InstrumentContainer>

  it('renders an instrument display name', () => {
    props = {
      displayName: 'P300 8-Channel GEN2',
    }
    const { getByText } = render(props)
    getByText('P300 8-Channel GEN2')
  })
})
