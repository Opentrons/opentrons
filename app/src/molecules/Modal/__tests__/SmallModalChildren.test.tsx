import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { SmallModalChildren } from '../SmallModalChildren'

const props = {
  header: 'header',
  subText: 'subText',
  buttonText: 'buttonText',
  handleCloseMaxPinsAlert: jest.fn(),
}
const render = () => {
  return renderWithProviders(<SmallModalChildren {...props} />)
}

describe('SmallModalChildren', () => {
  it('should have a close button and render other text', () => {
    render()
    screen.getByText('header')
    screen.getByText('subText')
    fireEvent.click(screen.getByText('buttonText'))
    expect(props.handleCloseMaxPinsAlert).toHaveBeenCalled()
  })
})
