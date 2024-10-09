import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockDropTipWizardContainerProps } from '../__fixtures__'
import {
  useWizardExitHeader,
  useSeenBlowoutSuccess,
  DropTipWizardHeader,
} from '../DropTipWizardHeader'
import { DT_ROUTES } from '../constants'

import type { Mock } from 'vitest'
import type { UseWizardExitHeaderProps } from '../DropTipWizardHeader'

const render = (props: React.ComponentProps<typeof DropTipWizardHeader>) => {
  return renderWithProviders(<DropTipWizardHeader {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DropTipWizardHeader', () => {
  let props: React.ComponentProps<typeof DropTipWizardHeader>

  beforeEach(() => {
    props = mockDropTipWizardContainerProps
  })

  it('renders appropriate copy and onClick behavior', () => {
    render(props)
    screen.getByText('Drop tips')
    screen.getByText('Step 1 / 5')
  })
})

describe('useSeenBlowoutSuccess', () => {
  it('should not render step counter when currentRoute is BEFORE_BEGINNING', () => {
    const { result } = renderHook(() =>
      useSeenBlowoutSuccess({
        currentStep: 'SOME_STEP' as any,
        currentRoute: DT_ROUTES.BEFORE_BEGINNING,
        currentStepIdx: 0,
      })
    )

    expect(result.current.totalSteps).toBe(null)
    expect(result.current.currentStepNumber).toBe(null)
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
