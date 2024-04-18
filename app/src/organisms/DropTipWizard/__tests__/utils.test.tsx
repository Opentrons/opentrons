import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, render, fireEvent } from '@testing-library/react'

import { useDropTipErrorComponents, useWizardExitHeader } from '../utils'
import { DROP_TIP_SPECIAL_ERROR_TYPES } from '../constants'

import type { Mock } from 'vitest'
import type {
  UseDropTipErrorComponentsProps,
  UseWizardExitHeaderProps,
} from '../utils'

const MOCK_MAINTENANCE_RUN_ID = 'MOCK_MAINTENANCE_RUN_ID'
const MOCK_ERROR_TYPE = 'MOCK_ERROR_TYPE'
const MOCK_ERROR_MESSAGE = 'MOCK_ERROR_MESSAGE'
const MOCK_ERROR_HEADER = 'MOCK_ERROR_HEADER'

describe('useDropTipErrorComponents', () => {
  let props: UseDropTipErrorComponentsProps
  let mockOnClose: Mock
  let mockTranslation: Mock
  let mockChainRunCommands: Mock

  beforeEach(() => {
    mockOnClose = vi.fn()
    mockTranslation = vi.fn()
    mockChainRunCommands = vi.fn()

    props = {
      maintenanceRunId: MOCK_MAINTENANCE_RUN_ID,
      onClose: mockOnClose,
      errorDetails: {
        type: MOCK_ERROR_TYPE,
        message: MOCK_ERROR_MESSAGE,
        header: MOCK_ERROR_HEADER,
      },
      isOnDevice: true,
      t: mockTranslation,
      chainRunCommands: mockChainRunCommands,
    }
  })

  it('should return the generic text and error message if there is are no special-cased error details', () => {
    const result = useDropTipErrorComponents(props)
    expect(result.button).toBeNull()
    render(result.subHeader)
    expect(mockTranslation).toHaveBeenCalledWith('drop_tip_failed')
    screen.getByText(MOCK_ERROR_MESSAGE)
  })

  it('should return a generic message only if there are no error details', () => {
    props.errorDetails = null
    const result = useDropTipErrorComponents(props)
    expect(result.button).toBeNull()
    render(result.subHeader)
    expect(mockTranslation).toHaveBeenCalledWith('drop_tip_failed')
    expect(screen.queryByText(MOCK_ERROR_MESSAGE)).not.toBeInTheDocument()
  })

  it(`should return correct special components if error type is ${DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR}`, () => {
    // @ts-expect-error errorDetails is in fact not null in the test.
    props.errorDetails.type = DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR
    const result = useDropTipErrorComponents(props)
    expect(mockTranslation).toHaveBeenCalledWith('confirm_removal_and_home')

    render(result.button)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(mockOnClose).toHaveBeenCalled()
    expect(mockChainRunCommands).toHaveBeenCalledWith(
      MOCK_MAINTENANCE_RUN_ID,
      [
        {
          commandType: 'home' as const,
          params: {},
        },
      ],
      true
    )

    render(result.subHeader)
    screen.getByText(MOCK_ERROR_MESSAGE)
  })
})

describe('useWizardExitHeader', () => {
  let props: UseWizardExitHeaderProps
  let mockHandleCleanUpAndClose: Mock
  let mockConfirmExit: Mock

  beforeEach(() => {
    mockHandleCleanUpAndClose = vi.fn()
    mockConfirmExit = vi.fn()

    props = {
      isFinalStep: true,
      hasInitiatedExit: false,
      errorDetails: null,
      handleCleanUpAndClose: mockHandleCleanUpAndClose,
      confirmExit: mockConfirmExit,
    }
  })

  it('should appropriately return handleCleanUpAndClose', () => {
    const handleExit = useWizardExitHeader(props)
    expect(handleExit).toEqual(props.handleCleanUpAndClose)
  })

  it('should appropriately return confirmExit', () => {
    props = { ...props, isFinalStep: false }
    const handleExit = useWizardExitHeader(props)
    expect(handleExit).toEqual(props.confirmExit)
  })

  it('should appropriately return handleCleanUpAndClose with homeOnError = false', () => {
    const errorDetails = { message: 'Some error occurred' }
    const modifiedProps = { ...props, errorDetails }
    const handleExit = useWizardExitHeader(modifiedProps)
    expect(mockHandleCleanUpAndClose.mock.calls.length).toBe(0)
    handleExit()
    expect(mockHandleCleanUpAndClose).toHaveBeenCalledWith(false)
  })

  it('should appropriately return a function that does nothing ', () => {
    const modifiedProps = { ...props, hasInitiatedExit: true }
    const handleExit = useWizardExitHeader(modifiedProps)
    handleExit()
    expect(mockHandleCleanUpAndClose.mock.calls.length).toBe(0)
    expect(mockConfirmExit.mock.calls.length).toBe(0)
  })
})
