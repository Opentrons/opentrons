import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'

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
    render(props)
    screen.getByText('mock header')
    screen.getByTestId('ChildNavigation_Back_Button')
  })

  it('should call a mock function when tapping the back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockOnClickBack).toHaveBeenCalled()
  })

  it('should render text, back button and small button', () => {
    props = {
      ...props,
      buttonText: 'mock button',
      onClickButton: mockOnClickButton,
    }
    render(props)
    screen.getByText('mock header')
    screen.getByTestId('ChildNavigation_Back_Button')
    const mockButton = screen.getByText('mock button')
    fireEvent.click(mockButton)
    expect(mockOnClickButton).toHaveBeenCalled()
  })

  it('should render text, back button and 2 buttons', () => {
    props = {
      ...props,
      buttonText: 'mock button',
      onClickButton: mockOnClickButton,
      secondaryButtonProps: mockSecondaryButtonProps,
    }
    render(props)
    screen.getByText('mock header')
    screen.getByTestId('ChildNavigation_Back_Button')
    screen.getByText('mock button')
    const secondaryButton = screen.getByText('Setup Instructions')
    fireEvent.click(secondaryButton)
    expect(mockOnClickSecondaryButton).toHaveBeenCalled()
  })
})
