import { fireEvent, renderHook, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { vi, it, describe, expect } from 'vitest'

import { LEFT } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useConfirmCrashRecovery } from '../useConfirmCrashRecovery'
import { mockCalibrationCheckLabware } from '/app/redux/sessions/__fixtures__'
import {
  DECK_STEP_JOGGING_TO_DECK,
  SESSION_TYPE_DECK_CALIBRATION,
  sharedCalCommands,
} from '/app/redux/sessions'

describe('useConfirmCrashRecovery', () => {
  const mockSendCommands = vi.fn()
  const mockProps = {
    cleanUpAndExit: vi.fn(),
    tipRack: mockCalibrationCheckLabware,
    isMulti: false,
    mount: LEFT,
    currentStep: DECK_STEP_JOGGING_TO_DECK,
    sessionType: SESSION_TYPE_DECK_CALIBRATION,
  }

  it('renders the link text', () => {
    const { result } = renderHook(
      () =>
        useConfirmCrashRecovery({
          ...mockProps,
          sendCommands: mockSendCommands,
        }),
      {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        ),
      }
    )
    const [link, confirmation] = result.current
    expect(link).not.toBeNull()
    expect(confirmation).toBeNull()

    renderWithProviders(link, {
      i18nInstance: i18n,
    })
    screen.getByText('Jog too far or bend a tip?')
    screen.getByRole('button', { name: 'Start over' })
  })

  it('renders the modal with the right props when you click the link', () => {
    const { result } = renderHook(
      () =>
        useConfirmCrashRecovery({
          ...mockProps,
          sendCommands: mockSendCommands,
        }),
      {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        ),
      }
    )

    // render returned confirmation if not null, otherwise render the link
    renderWithProviders(<div>{result.current[1] ?? result.current[0]}</div>, {
      i18nInstance: i18n,
    })
    // click the link to launch the modal
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    // the confirmation should now not be null
    expect(result.current[1]).not.toBeNull()
  })

  it('renders the modal with the right props when you click back', () => {
    const { result } = renderHook(
      () =>
        useConfirmCrashRecovery({
          ...mockProps,
          sendCommands: mockSendCommands,
        }),
      {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        ),
      }
    )

    // the explicitly rerender to incorporate newly non-null confirmation
    const [{ rerender }] = renderWithProviders(
      <div>{result.current[1] ?? result.current[0]}</div>,
      {
        i18nInstance: i18n,
      }
    )

    // click the link to launch the modal
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))

    rerender(<div>{result.current[1] ?? result.current[0]}</div>)

    // click the "back" link in the confirmation
    const closeConfirmationButton = screen.getByRole('button', {
      name: 'resume',
    })
    fireEvent.click(closeConfirmationButton)
    // the confirmation should now be null once more
    expect(result.current[1]).toBeNull()

    // open the confirmation again and click the proceed to start over button
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    const startOverButton = screen.getByRole('button', { name: 'Start over' })
    fireEvent.click(startOverButton)
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: sharedCalCommands.INVALIDATE_LAST_ACTION,
    })
  })
})
