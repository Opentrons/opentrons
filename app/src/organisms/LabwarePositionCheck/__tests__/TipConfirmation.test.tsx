import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { TipConfirmation } from '../TipConfirmation'
import { i18n } from '../../../i18n'

const render = (props: React.ComponentProps<typeof TipConfirmation>) => {
  return renderWithProviders(<TipConfirmation {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TipConfirmation', () => {
  let props: React.ComponentProps<typeof TipConfirmation>

  beforeEach(() => {
    props = {
      invalidateTip: jest.fn(),
      confirmTip: jest.fn(),
    }
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should render correct copy', () => {
    const { getByText, getByRole } = render(props)
    getByText('Did pipette pick up tip successfully?')
    getByRole('button', { name: 'Yes' })
    getByRole('button', { name: 'Try again' })
  })
  it('should invoke callback props when ctas are clicked', () => {
    const { getByRole } = render(props)
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    expect(props.invalidateTip).toHaveBeenCalled()
    fireEvent.click(getByRole('button', { name: 'Yes' }))
    expect(props.confirmTip).toHaveBeenCalled()
  })
})
