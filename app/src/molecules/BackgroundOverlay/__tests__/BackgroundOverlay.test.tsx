import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { BackgroundOverlay } from '..'

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
