import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { StackerEnsureShuttleEmpty } from '../StackerEnsureShuttleEmpty'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    MoveLabwareOnDeck: vi.fn(),
  }
})

let mockProceedNextStep: Mock
let mockGoBackPrevStep: Mock

const render = (props: ComponentProps<typeof StackerEnsureShuttleEmpty>) => {
  return renderWithProviders(<StackerEnsureShuttleEmpty {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StackerEnsureShuttleEmpty', () => {
  let props: ComponentProps<typeof StackerEnsureShuttleEmpty>

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockGoBackPrevStep = vi.fn()

    props = {
      routeUpdateActions: {
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      },
      recoveryMap: {
        route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
        step: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY,
      },
    } as any
  })

  it('calls proceedNextStep when primary button is clicked', () => {
    render(props)
    clickButtonLabeled('Continue')
    expect(mockProceedNextStep).toHaveBeenCalled()
  })

  it('calls goBackPrevStep when secondary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Go back')

    await waitFor(() => {
      expect(mockGoBackPrevStep).toHaveBeenCalled()
    })
  })

  it('renders the correct content', () => {
    render(props)

    screen.getByText('Ensure stacker labware shuttle is empty')
    screen.getByText('Empty the labware shuttle so that the stacker is able to retry the retrieve command.')
  })

})
