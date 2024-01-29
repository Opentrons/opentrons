import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ConfirmCrashRecovery } from '../ConfirmCrashRecovery'

describe('ConfirmCrashRecovery', () => {
  const mockBack = jest.fn()
  const mockConfirm = jest.fn()
  const render = (
    props: Partial<React.ComponentProps<typeof ConfirmCrashRecovery>> = {}
  ) => {
    const { back = mockBack, confirm = mockConfirm } = props
    return renderWithProviders(
      <ConfirmCrashRecovery back={back} confirm={confirm} />,
      { i18nInstance: i18n }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking resume goes back', () => {
    render()
    const button = screen.getByRole('button', { name: 'resume' })
    fireEvent.click(button)
    expect(mockBack).toHaveBeenCalled()
  })

  it('clicking start over confirms start over', () => {
    render()
    const button = screen.getByRole('button', { name: 'Start over' })
    fireEvent.click(button)
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('renders correct copy', () => {
    render()
    screen.getByRole('heading', { name: 'Start over?' })
    screen.getByText('Starting over will cancel your calibration progress.')
    screen.getByText(
      'If you bent a tip, be sure to replace it with an undamaged tip in position A1 of the tip rack before resuming calibration.'
    )
  })
})
