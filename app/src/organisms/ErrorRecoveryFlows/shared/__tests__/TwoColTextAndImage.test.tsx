import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { TwoColTextAndImage } from '../TwoColTextAndImage'

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
let mockCloseLabwareLatch: Mock
let mockHandleMotionRouting: Mock

const render = (props: ComponentProps<typeof TwoColTextAndImage>) => {
  return renderWithProviders(<TwoColTextAndImage {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TwoColTextAndImage', () => {
  let props: ComponentProps<typeof TwoColTextAndImage>

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockGoBackPrevStep = vi.fn()
    mockCloseLabwareLatch = vi.fn().mockResolvedValue(undefined)
    mockHandleMotionRouting = vi.fn().mockResolvedValue(undefined)

    props = {
      routeUpdateActions: {
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
        handleMotionRouting: mockHandleMotionRouting,
      },
      recoveryMap: {
        route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
        step: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.MANUAL_REPLACE,
      },
      recoveryCommands: {
        closeLabwareLatch: mockCloseLabwareLatch,
      },
    } as any
  })

  it('calls proceedNextStep when primary button is clicked', () => {
    render(props)
    clickButtonLabeled('Continue')
    expect(mockProceedNextStep).toHaveBeenCalled()
  })

  it(`calls proceedNextStep and closeLabwareLatch when primary button is clicked for ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE}`, async () => {
    props.recoveryMap = {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.REENGAGE_LATCH,
    }
    render(props)
    clickButtonLabeled('Re-engage latch')
    expect(mockHandleMotionRouting).toHaveBeenCalledWith(
      true,
      RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE
    )

    await waitFor(() => {
      expect(mockCloseLabwareLatch).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockProceedNextStep).toHaveBeenCalled()
    })
  })

  it(`passes correct title for ${RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE}`, () => {
    render(props)
    screen.getByText('Load labware shuttle onto track')
    screen.getByText(
      'Take any necessary precautions before loading the labware shuttle onto the track.'
    )
  })
})
