import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'
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
    const { getByText, getByTestId, getByRole } = render(props)
    getByText('button label')
    expect(getByTestId('back_icon')).toBeInTheDocument()
    const button = getByRole('button')
    expect(button).toHaveStyle(`background-color: ${COLORS.transparent}`)
    button.click()
    expect(props.onClick).toHaveBeenCalled()
  })
})
