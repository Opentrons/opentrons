import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { BackgroundOverlay } from '..'

const render = (props: React.ComponentProps<typeof BackgroundOverlay>) => {
  return renderWithProviders(<BackgroundOverlay {...props} />)[0]
}

describe('BackgroundOverlay', () => {
  let props: React.ComponentProps<typeof BackgroundOverlay>
  it('renders background overlay', () => {
    props = { onClick: jest.fn() }
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
