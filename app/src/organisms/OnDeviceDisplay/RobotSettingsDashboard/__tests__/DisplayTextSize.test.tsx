import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'

import { DisplayTextSize } from '../DisplayTextSize'

const mockFunc = jest.fn()
const render = (props: React.ComponentProps<typeof DisplayTextSize>) => {
  return renderWithProviders(<DisplayTextSize {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisplayTextSize', () => {
  let props: React.ComponentProps<typeof DisplayTextSize>

  beforeEach(() => {
    props = {
      setCurrentOption: mockFunc,
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Text Size')
    getByTestId('DisplayTextSize_back_button')
    getByTestId('DisplayTextSize_decrease')
    getByTestId('DisplayTextSize_increase')
  })

  // ToDo (kj:03/03/2023) These cases will be added when text size change method is decided
  // it('should call mock function when tapping plus button', () => {})
  // it('should call mock function when tapping minus button', () => {})

  it('should call mock function when tapping back button', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('DisplayTextSize_back_button')
    fireEvent.click(button)
    expect(mockFunc).toHaveBeenCalled()
  })
})
