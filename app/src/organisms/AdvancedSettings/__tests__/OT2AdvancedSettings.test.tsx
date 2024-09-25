import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { i18n } from '/app/i18n'

import {
  resetUseTrashSurfaceForTipCal,
  setUseTrashSurfaceForTipCal,
} from '/app/redux/calibration'
import { getUseTrashSurfaceForTipCal } from '/app/redux/config'
import { renderWithProviders } from '/app/__testing-utils__'
import { OT2AdvancedSettings } from '../OT2AdvancedSettings'

vi.mock('/app/redux/calibration')
vi.mock('/app/redux/config')

const render = () => {
  return renderWithProviders(<OT2AdvancedSettings />, {
    i18nInstance: i18n,
  })
}

describe('OT2AdvancedSettings', () => {
  beforeEach(() => {
    vi.mocked(getUseTrashSurfaceForTipCal).mockReturnValue(true)
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
    expect(vi.mocked(setUseTrashSurfaceForTipCal)).toHaveBeenCalledWith(false)
  })

  it('should call mock setUseTrashSurfaceForTipCal with true when selecting always trash', () => {
    vi.mocked(getUseTrashSurfaceForTipCal).mockReturnValue(false)
    render()
    const radioButton = screen.getByRole('radio', {
      name: 'Always use trash bin to calibrate',
    })
    fireEvent.click(radioButton)
    expect(vi.mocked(setUseTrashSurfaceForTipCal)).toHaveBeenCalledWith(true)
  })

  it('should call mock resetUseTrashSurfaceForTipCal when selecting always prompt', () => {
    render()
    const radioButton = screen.getByRole('radio', {
      name: 'Always show the prompt to choose calibration block or trash bin',
    })
    fireEvent.click(radioButton)
    expect(vi.mocked(resetUseTrashSurfaceForTipCal)).toHaveBeenCalled()
  })
})
