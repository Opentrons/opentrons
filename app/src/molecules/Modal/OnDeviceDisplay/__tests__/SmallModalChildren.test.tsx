import * as React from 'react'
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
    const [{ getByText }] = render()
    getByText('header')
    getByText('subText')
    getByText('buttonText').click()
    expect(props.handleCloseMaxPinsAlert).toHaveBeenCalled()
  })
})
