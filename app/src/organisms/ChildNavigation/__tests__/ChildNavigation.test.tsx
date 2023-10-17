import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { SmallButton } from '../../../atoms/buttons'
import { ChildNavigation } from '..'

const render = (props: React.ComponentProps<typeof ChildNavigation>) =>
  renderWithProviders(<ChildNavigation {...props} />)

const mockOnClickBack = jest.fn()
const mockOnClickButton = jest.fn()
const mockOnClickSecondaryButton = jest.fn()

const mockSecondaryButtonProps: React.ComponentProps<typeof SmallButton> = {
  onClick: mockOnClickSecondaryButton,
  buttonText: 'Setup Instructions',
  buttonType: 'tertiaryLowLight',
  iconName: 'information',
  iconPlacement: 'startIcon',
}

describe('ChildNavigation', () => {
  let props: React.ComponentProps<typeof ChildNavigation>

  beforeEach(() => {
    props = {
      header: 'mock header',
      onClickBack: mockOnClickBack,
    }
  })

  it('should render text and back button', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock header')
    getByTestId('ChildNavigation_Back_Button')
  })

  it('should call a mock function when tapping the back button', () => {
    const [{ getByTestId }] = render(props)
    getByTestId('ChildNavigation_Back_Button').click()
    expect(mockOnClickBack).toHaveBeenCalled()
  })

  it('should render text, back button and small button', () => {
    props = {
      ...props,
      buttonText: 'mock button',
      onClickButton: mockOnClickButton,
    }
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock header')
    getByTestId('ChildNavigation_Back_Button')
    const mockButton = getByText('mock button')
    mockButton.click()
    expect(mockOnClickButton).toHaveBeenCalled()
  })

  it('should render text, back button and 2 buttons', () => {
    props = {
      ...props,
      buttonText: 'mock button',
      onClickButton: mockOnClickButton,
      secondaryButtonProps: mockSecondaryButtonProps,
    }
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock header')
    getByTestId('ChildNavigation_Back_Button')
    getByText('mock button')
    const secondaryButton = getByText('Setup Instructions')
    secondaryButton.click()
    expect(mockOnClickSecondaryButton).toHaveBeenCalled()
  })
})
