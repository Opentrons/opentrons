import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectCalibrationSlot } from '../SelectCalibrationSlot'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SelectCalibrationSlot>) => {
  return renderWithProviders(<SelectCalibrationSlot {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SelectCalibrationSlot', () => {
  let props: ComponentProps<typeof SelectCalibrationSlot>

  beforeEach(() => {
    props = {
      header: 'Select a deck slot to calibrate the pipette.',
      selectedSlot: 'B2',
      setSelectedSlot: vi.fn(),
      proceed: vi.fn(),
      isOnDevice: false,
    }
  })

  it('defaults to B2 and can switch to C2', () => {
    render(props)
    screen.getByText('Select a deck slot to calibrate the pipette.')
    expect(screen.getByRole('label', { name: 'B2' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('label', { name: 'C2' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    screen.getByRole('link', { name: 'Need help?' })

    fireEvent.click(screen.getByRole('label', { name: 'C2' }))
    expect(props.setSelectedSlot).toHaveBeenCalledWith('C2')
  })

  it('calls proceed when Begin calibration is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Begin calibration' }))
    expect(props.proceed).toHaveBeenCalled()
  })

  it('hides the need help link on device', () => {
    render({ ...props, isOnDevice: true })
    expect(
      screen.queryByRole('link', { name: 'Need help?' })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Begin calibration' }))
    expect(props.proceed).toHaveBeenCalled()
  })
})
