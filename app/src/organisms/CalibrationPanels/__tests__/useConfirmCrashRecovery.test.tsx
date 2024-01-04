import * as React from 'react'
import { fireEvent, renderHook } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { LEFT } from '@opentrons/shared-data'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { useConfirmCrashRecovery } from '../useConfirmCrashRecovery'
import { mockCalibrationCheckLabware } from '../../../redux/sessions/__fixtures__'
import {
  DECK_STEP_JOGGING_TO_DECK,
  SESSION_TYPE_DECK_CALIBRATION,
  sharedCalCommands,
} from '../../../redux/sessions'

describe('useConfirmCrashRecovery', () => {
  const mockSendCommands = jest.fn()
  const mockProps = {
    cleanUpAndExit: jest.fn(),
    tipRack: mockCalibrationCheckLabware,
    isMulti: false,
    mount: LEFT,
    currentStep: DECK_STEP_JOGGING_TO_DECK,
    sessionType: SESSION_TYPE_DECK_CALIBRATION,
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

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

    const { getByText, getByRole } = renderWithProviders(link, {
      i18nInstance: i18n,
    })[0]
    getByText('Jog too far or bend a tip?')
    getByRole('button', { name: 'Start over' })
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
    const { getByRole, rerender } = renderWithProviders(
      <div>{result.current[1] ?? result.current[0]}</div>,
      { i18nInstance: i18n }
    )[0]
    // click the link to launch the modal
    fireEvent.click(getByRole('button', { name: 'Start over' }))
    // the confirmation should now not be null
    expect(result.current[1]).not.toBeNull()
    // the explicitly rerender to incorporate newly non-null confirmation
    rerender(<div>{result.current[1] ?? result.current[0]}</div>)

    // click the "back" link in the confirmation
    const closeConfirmationButton = getByRole('button', { name: 'resume' })
    fireEvent.click(closeConfirmationButton)
    // the confirmation should now be null once more
    expect(result.current[1]).toBeNull()

    // open the confirmation again and click the proceed to start over button
    fireEvent.click(getByRole('button', { name: 'Start over' }))
    const startOverButton = getByRole('button', { name: 'Start over' })
    fireEvent.click(startOverButton)
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: sharedCalCommands.INVALIDATE_LAST_ACTION,
    })
  })
})
