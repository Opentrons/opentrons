import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders, LEGACY_COLORS } from '@opentrons/components'
import { ODDBackButton } from '..'

const render = (props: React.ComponentProps<typeof ODDBackButton>) => {
  return renderWithProviders(<ODDBackButton {...props} />)[0]
}

describe('ODDBackButton', () => {
  let props: React.ComponentProps<typeof ODDBackButton>

  beforeEach(() => {
    props = {
      label: 'button label',
      onClick: jest.fn(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and icon', () => {
    render(props)
    screen.getByText('button label')
    expect(screen.getByTestId('back_icon')).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toHaveStyle(`background-color: ${LEGACY_COLORS.transparent}`)
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })
})
