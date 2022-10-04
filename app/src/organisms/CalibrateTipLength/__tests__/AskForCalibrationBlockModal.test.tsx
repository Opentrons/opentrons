import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { setUseTrashSurfaceForTipCal } from '../../../redux/calibration'
import { AskForCalibrationBlockModal } from '../AskForCalibrationBlockModal'

describe('AskForCalibrationBlockModal', () => {
  let onResponse: jest.MockedFunction<() => {}>

  let render: (
    props?: Partial<React.ComponentProps<typeof AskForCalibrationBlockModal>>
  ) => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    onResponse = jest.fn()
    render = () =>
      renderWithProviders<
        React.ComponentProps<typeof AskForCalibrationBlockModal>
      >(
        <AskForCalibrationBlockModal
          onResponse={onResponse}
          titleBarTitle="Test Cal Flow"
          closePrompt={jest.fn()}
        />,
        { i18nInstance: i18n }
      )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('saves preference when not checked and use trash is clicked', () => {
    const [{ getByRole }, { dispatch }] = render()
    getByRole('checkbox').click()
    getByRole('button', { name: 'Use trash bin' }).click()
    expect(dispatch).not.toHaveBeenCalled()
    expect(onResponse).toHaveBeenCalledWith(false)
  })
  it('does not save preference when not checked and use trash is clicked', () => {
    const [{ getByRole }, { dispatch }] = render()
    getByRole('button', { name: 'Use Calibration Block' }).click()
    expect(dispatch).toHaveBeenCalledWith(setUseTrashSurfaceForTipCal(false))
    expect(onResponse).toHaveBeenCalledWith(true)
  })
  it('saves preference when not checked and use block is clicked', () => {
    const [{ getByRole }, { dispatch }] = render()
    getByRole('checkbox').click()
    getByRole('button', { name: 'Use trash bin' }).click()
    expect(dispatch).not.toHaveBeenCalled()
    expect(onResponse).toHaveBeenCalledWith(false)
  })
  it('does not save preference when not checked and use block is clicked', () => {
    const [{ getByRole }, { dispatch }] = render()
    getByRole('button', { name: 'Use Calibration Block' }).click()
    expect(dispatch).toHaveBeenCalledWith(setUseTrashSurfaceForTipCal(false))
    expect(onResponse).toHaveBeenCalledWith(true)
  })
})
