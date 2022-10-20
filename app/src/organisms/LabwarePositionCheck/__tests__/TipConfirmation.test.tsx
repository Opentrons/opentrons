import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
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
    getByRole('button', {name: 'yes'})
    getByRole('button', {name: 'try again'})
  })
  it('should invoke callback props when ctas are clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', {name: 'yes'}).click()
    expect(props.invalidateTip).toHaveBeenCalled()
    getByRole('button', {name: 'try again'}).click()
    expect(props.confirmTip).toHaveBeenCalled()
  })
})
