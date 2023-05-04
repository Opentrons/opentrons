import { BackgroundOverlay } from '..'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'

const render = (props: React.ComponentProps<typeof BackgroundOverlay>) => {
  return renderWithProviders(<BackgroundOverlay {...props} />)[0]
}

describe('BackgroundOverlay', () => {
  let props: React.ComponentProps<typeof BackgroundOverlay>
  it('renders background overlay', () => {
    props = { onClick: jest.fn() }
    const { getByLabelText } = render(props)
    getByLabelText('BackgroundOverlay').click()
    expect(props.onClick).toHaveBeenCalled()
  })
})
