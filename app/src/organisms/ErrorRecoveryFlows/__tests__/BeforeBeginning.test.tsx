import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockRecoveryContentProps } from '../__fixtures__'
import { BeforeBeginning } from '../BeforeBeginning'
import { RECOVERY_MAP } from '../constants'

import type { Mock } from 'vitest'

const render = (props: React.ComponentProps<typeof BeforeBeginning>) => {
  return renderWithProviders(<BeforeBeginning {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('BeforeBeginning', () => {
  const { BEFORE_BEGINNING } = RECOVERY_MAP
  let props: React.ComponentProps<typeof BeforeBeginning>
  let mockProceedNextStep: Mock

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    const mockRouteUpdateActions = {
      proceedNextStep: mockProceedNextStep,
    } as any

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: mockRouteUpdateActions,
      recoveryMap: {
        route: BEFORE_BEGINNING.ROUTE,
        step: BEFORE_BEGINNING.STEPS.RECOVERY_DESCRIPTION,
      },
    }
  })

  it('renders appropriate copy and click behavior', () => {
    render(props)

    screen.getByText('Before you begin')
    screen.queryByText(
      'Recovery Mode provides you with guided and manual controls for handling errors at runtime.'
    )

    const primaryBtn = screen.getByRole('button', {
      name: 'View recovery options',
    })

    fireEvent.click(primaryBtn)

    expect(mockProceedNextStep).toHaveBeenCalled()
  })
})
