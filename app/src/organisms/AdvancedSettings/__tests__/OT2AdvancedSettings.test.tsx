import * as React from 'react'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import {
  resetUseTrashSurfaceForTipCal,
  setUseTrashSurfaceForTipCal,
} from '../../../redux/calibration'
import { getUseTrashSurfaceForTipCal } from '../../../redux/config'
import { OT2AdvancedSettings } from '../OT2AdvancedSettings'

jest.mock('../../../redux/calibration')
jest.mock('../../../redux/config')

const mockResetUseTrashSurfaceForTipCal = resetUseTrashSurfaceForTipCal as jest.MockedFunction<
  typeof resetUseTrashSurfaceForTipCal
>

const mockSetUseTrashSurfaceForTipCal = setUseTrashSurfaceForTipCal as jest.MockedFunction<
  typeof setUseTrashSurfaceForTipCal
>

const mockGetUseTrashSurfaceForTipCal = getUseTrashSurfaceForTipCal as jest.MockedFunction<
  typeof getUseTrashSurfaceForTipCal
>

const render = () => {
  return renderWithProviders(<OT2AdvancedSettings />, {
    i18nInstance: i18n,
  })
}

describe('OT2AdvancedSettings', () => {
  beforeEach(() => {
    mockGetUseTrashSurfaceForTipCal.mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and toggle button', () => {
    render()
    screen.getByText('OT-2 Advanced Settings')
    screen.getByText('Tip Length Calibration Method')
    screen.getByRole('radio', {
      name: 'Always use calibration block to calibrate',
    })
    screen.getByRole('radio', { name: 'Always use trash bin to calibrate' })
    screen.getByRole('radio', {
      name: 'Always show the prompt to choose calibration block or trash bin',
    })
  })

  it('should call mock setUseTrashSurfaceForTipCal with false when selecting always block', () => {
    render()
    const radioButton = screen.getByRole('radio', {
      name: 'Always use calibration block to calibrate',
    })
    fireEvent.click(radioButton)
    expect(mockSetUseTrashSurfaceForTipCal).toHaveBeenCalledWith(false)
  })

  it('should call mock setUseTrashSurfaceForTipCal with true when selecting always trash', () => {
    mockGetUseTrashSurfaceForTipCal.mockReturnValue(false)
    render()
    const radioButton = screen.getByRole('radio', {
      name: 'Always use trash bin to calibrate',
    })
    fireEvent.click(radioButton)
    expect(mockSetUseTrashSurfaceForTipCal).toHaveBeenCalledWith(true)
  })

  it('should call mock resetUseTrashSurfaceForTipCal when selecting always prompt', () => {
    render()
    const radioButton = screen.getByRole('radio', {
      name: 'Always show the prompt to choose calibration block or trash bin',
    })
    fireEvent.click(radioButton)
    expect(mockResetUseTrashSurfaceForTipCal).toHaveBeenCalled()
  })
})
