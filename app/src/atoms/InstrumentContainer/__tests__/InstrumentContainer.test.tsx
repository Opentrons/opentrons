import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'
import { InstrumentContainer } from '..'

const render = (props: React.ComponentProps<typeof InstrumentContainer>) => {
  return renderWithProviders(<InstrumentContainer {...props} />)[0]
}

describe('InstrumentContainer', () => {
  let props: React.ComponentProps<typeof InstrumentContainer>

  it('renders an instrument display name with dark black enabled text', () => {
    props = {
      displayName: 'P300 8-Channel GEN2',
    }
    const { getByText } = render(props)
    expect(getByText('P300 8-Channel GEN2')).toHaveStyle(
      `color: ${COLORS.darkBlackEnabled}`
    )
  })
})
