import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ConfirmCrashRecovery } from '../ConfirmCrashRecovery'

describe('ConfirmCrashRecovery', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ConfirmCrashRecovery>>
  ) => ReturnType<typeof renderWithProviders>
  const mockBack = jest.fn()
  const mockConfirm = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
      const { back = mockBack, confirm = mockConfirm } = props
      return renderWithProviders(
        <ConfirmCrashRecovery back={back} confirm={confirm} />,
        { i18nInstance: i18n }
      )
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking resume goes back', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'resume' }).click()
    expect(mockBack).toHaveBeenCalled()
  })

  it('clicking start over confirms start over', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Start over' }).click()
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('renders correct copy', () => {
    const { getByText, getByRole } = render()[0]
    getByRole('heading', { name: 'Start over?' })
    getByText('Starting over will cancel your calibration progress.')
    getByText(
      'If you bent a tip, be sure to replace it with an undamaged tip in position A1 of the tip rack before resuming calibration.'
    )
  })
})
