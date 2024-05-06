import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { ResumeRun } from '../ResumeRun'
import { RECOVERY_MAP, ERROR_KINDS } from '../../constants'

import type { Mock } from 'vitest'

const render = (props: React.ComponentProps<typeof ResumeRun>) => {
  return renderWithProviders(<ResumeRun {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryFooterButtons', () => {
  const { RESUME } = RECOVERY_MAP
  let props: React.ComponentProps<typeof ResumeRun>
  let mockOnComplete: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockOnComplete = vi.fn()
    mockGoBackPrevStep = vi.fn()
    const mockRouteUpdateActions = { goBackPrevStep: mockGoBackPrevStep } as any

    props = {
      isOnDevice: true,
      errorKind: ERROR_KINDS.GENERAL_ERROR,
      onComplete: mockOnComplete,
      routeUpdateActions: mockRouteUpdateActions,
      recoveryMap: {
        route: RESUME.ROUTE,
        step: RESUME.STEPS.CONFIRM_RESUME,
      },
    }
  })

  it('renders appropriate copy and click behavior', () => {
    render(props)

    screen.getByText('Are you sure you want to resume?')
    screen.queryByText(
      'The run will resume from the point at which the error occurred.'
    )

    const primaryBtn = screen.getByRole('button', { name: 'Confirm' })
    const secondaryBtn = screen.getByRole('button', { name: 'Go back' })

    fireEvent.click(primaryBtn)
    fireEvent.click(secondaryBtn)

    expect(mockOnComplete).toHaveBeenCalled()
    expect(mockGoBackPrevStep).toHaveBeenCalled()
  })
})
