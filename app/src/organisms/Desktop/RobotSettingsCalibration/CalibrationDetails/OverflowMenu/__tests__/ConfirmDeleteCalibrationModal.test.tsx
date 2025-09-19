import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ConfirmDeleteCalibrationModal } from '../ConfirmDeleteCalibrationModal'

import type { ComponentProps } from 'react'

const render = (
  props: ComponentProps<typeof ConfirmDeleteCalibrationModal>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ConfirmDeleteCalibrationModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConfirmDeleteCalibrationModal', () => {
  let props: ComponentProps<typeof ConfirmDeleteCalibrationModal>
  const mockDeleteCalibration = vi.fn()
  const mockToggleModal = vi.fn()

  beforeEach(() => {
    props = { onDelete: mockDeleteCalibration, toggleModal: mockToggleModal }
  })

  it('renders appropriate modal copy', () => {
    render(props)

    screen.getByText('Delete calibration data?')
    screen.getByText(
      'This action cannot be undone. You will need to recalibrate before running a protocol.'
    )
  })

  it('calls the cancel onClick when clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockToggleModal).toHaveBeenCalled()
  })

  it('calls the delete onClick when clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Delete calibration data'))

    expect(mockToggleModal).toHaveBeenCalled()
  })
})
