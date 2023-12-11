import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { setUseTrashSurfaceForTipCal } from '../../../redux/calibration'
import { AskForCalibrationBlockModal } from '../AskForCalibrationBlockModal'
import { fireEvent, screen } from '@testing-library/react'

describe('AskForCalibrationBlockModal', () => {
  const onResponse = jest.fn()
  const render = () => {
    return renderWithProviders<
      React.ComponentProps<typeof AskForCalibrationBlockModal>
    >(
      <AskForCalibrationBlockModal
        onResponse={onResponse}
        titleBarTitle="Test Cal Flow"
        closePrompt={jest.fn()}
      />,
      { i18nInstance: i18n }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('saves preference when not checked and use trash is clicked', () => {
    const { dispatch } = render()[1]
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    const button = screen.getByRole('button', { name: 'Use trash bin' })
    fireEvent.click(button)
    expect(dispatch).not.toHaveBeenCalled()
    expect(onResponse).toHaveBeenCalledWith(false)
  })
  it('does not save preference when not checked and use trash is clicked', () => {
    const { dispatch } = render()[1]
    const button = screen.getByRole('button', { name: 'Use Calibration Block' })
    fireEvent.click(button)
    expect(dispatch).toHaveBeenCalledWith(setUseTrashSurfaceForTipCal(false))
    expect(onResponse).toHaveBeenCalledWith(true)
  })
  it('saves preference when not checked and use block is clicked', () => {
    const { dispatch } = render()[1]
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    const button = screen.getByRole('button', { name: 'Use trash bin' })
    fireEvent.click(button)
    expect(dispatch).not.toHaveBeenCalled()
    expect(onResponse).toHaveBeenCalledWith(false)
  })
  it('does not save preference when not checked and use block is clicked', () => {
    const { dispatch } = render()[1]
    const button = screen.getByRole('button', { name: 'Use Calibration Block' })
    fireEvent.click(button)
    expect(dispatch).toHaveBeenCalledWith(setUseTrashSurfaceForTipCal(false))
    expect(onResponse).toHaveBeenCalledWith(true)
  })
})
