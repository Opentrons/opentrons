import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/LabwarePositionCheck/__tests__/utils'

import { RECOVERY_MAP } from '../../constants'
import { ManualReplaceLwAndRetry } from '../ManualReplaceLwAndRetry'

import type { ComponentProps } from 'react'

vi.mock('../../shared', async importOriginal => {
  const mod = (await importOriginal()) as any
  return {
    ...mod,
    HoldingLabware: vi.fn(() => <div>MOCK_HOLDING_LABWARE</div>),
    ReleaseLabware: vi.fn(() => <div>MOCK_RELEASE_LABWARE</div>),
    TwoColLwInfoAndDeck: vi.fn(() => <div>MOCK_TWO_COL_LW_INFO_AND_DECK</div>),
    RetryStepInfo: vi.fn(() => <div>MOCK_RETRY_STEP_INFO</div>),
    SkipStepInfo: vi.fn(() => <div>MOCK_SKIP_STEP_INFO</div>),
    RecoveryDoorOpenSpecial: vi.fn(() => <div>MOCK_DOOR_OPEN_SPECIAL</div>),
    LeftColumnLabwareInfo: vi.fn(() => <div>MOCK_LEFT_COL_LABWARE_INFO</div>),
  }
})

vi.mock('../SelectRecoveryOption', () => ({
  SelectRecoveryOption: vi.fn(() => <div>MOCK_SELECT_RECOVERY_OPTION</div>),
}))

describe('ManualReplaceLwAndRetry', () => {
  let props: ComponentProps<typeof ManualReplaceLwAndRetry>

  beforeEach(() => {
    props = {
      recoveryMap: {
        route: RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
        step:
          RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE,
      },
      doorStatusUtils: {
        isDoorOpen: false,
      },
      routeUpdateActions: {
        proceedToRouteAndStep: vi.fn(),
        handleMotionRouting: vi.fn(() => Promise.resolve()),
      },
      recoveryCommands: {
        homeShuttle: vi.fn(() => Promise.resolve()),
      },
      stepCounts: {
        hasRunDiverged: false,
      },
    } as any
  })

  const render = (props: ComponentProps<typeof ManualReplaceLwAndRetry>) => {
    return renderWithProviders(<ManualReplaceLwAndRetry {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it(`renders HoldingLabware for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE}`, () => {
    render(props)
    screen.getByText('MOCK_HOLDING_LABWARE')
  })

  it(`renders ReleaseLabware for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE
    render(props)
    screen.getByText('MOCK_RELEASE_LABWARE')
  })

  it(`renders RecoveryDoorOpenSpecial for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME
    render(props)
    screen.getByText('MOCK_DOOR_OPEN_SPECIAL')
  })

  it(`renders TwoColLwInfoAndDeck for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE
    render(props)
    screen.getByText('MOCK_TWO_COL_LW_INFO_AND_DECK')
  })

  it(`renders RetryStepInfo for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.RETRY} step`, () => {
    props.recoveryMap.step = RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.RETRY
    render(props)
    screen.getByText('MOCK_RETRY_STEP_INFO')
  })

  it('renders SelectRecoveryOption for unknown step', () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})

describe('ManualReplaceLwAndRetry for Stacker Recovery Routes', () => {
  let props: ComponentProps<typeof ManualReplaceLwAndRetry>
  let mockProceedNextStep: Mock
  let mockManualRetrieve: Mock

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockManualRetrieve = vi.fn().mockResolvedValue(undefined)
    props = {
      doorStatusUtils: {
        isDoorOpen: false,
      },
      routeUpdateActions: {
        proceedToRouteAndStep: vi.fn(),
        handleMotionRouting: vi.fn(() => Promise.resolve()),
        proceedNextStep: mockProceedNextStep,
      },
      recoveryCommands: {
        homeShuttle: vi.fn(() => Promise.resolve()),
        manualRetrieve: mockManualRetrieve,
      },
      stepCounts: {
        hasRunDiverged: false,
      },
    } as any
  })
  const render = (props: ComponentProps<typeof ManualReplaceLwAndRetry>) => {
    return renderWithProviders(<ManualReplaceLwAndRetry {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  describe.each([
    {
      route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS
          .PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING,
    },
  ])('renders PrepareStackerHome', ({ route, step }) => {
    it(`for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('Prepare track for homing')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS,
    },
  ])('renders PrepareStackerHome', ({ route, step }) => {
    it(`renders PrepareStackerHome for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('Clear track of obstructions')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.EMPTY_STACKER,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER,
    },
  ])('renders EmptyStacker', ({ route, step }) => {
    it(`renders EmptyStacker for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('Empty stacker of labware above latch')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.REENGAGE_LATCH,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH,
    },
  ])('renders ReengageLatch', ({ route, step }) => {
    it(`renders ReengageLatch for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('Prepare for stacker latch to re-engage')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.LOAD_SHUTTLE,
    },
  ])('renders LoadShuttle', ({ route, step }) => {
    it(`renders LoadShuttle for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('Load labware shuttle onto track')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE,
    },
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      step:
        RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE,
    },
  ])('renders ShuttleLabwareInfo', ({ route, step }) => {
    it(`renders ShuttleLabwareInfo for ${route} route and ${step} step`, async () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('MOCK_LEFT_COL_LABWARE_INFO')

      const continueBtn = screen.queryAllByText('Continue')[0]
      fireEvent.click(continueBtn)
      clickButtonLabeled('Continue')
      await waitFor(() => {
        expect(mockManualRetrieve).toHaveBeenCalled()
      })
      await waitFor(() => {
        expect(mockProceedNextStep).toHaveBeenCalled()
      })
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.STEPS.FILL_HOPPER,
    },
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.STEPS.FILL_HOPPER,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.FILL_HOPPER,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CHECK_HOPPER,
    },
    {
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CHECK_HOPPER,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.CHECK_HOPPER,
    },
  ])('renders HopperLabwareInfo', ({ route, step }) => {
    it(`for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      props.failedLabwareUtils = {
        ...props.failedLabwareUtils,
        labwareQuantity: 2,
      } // Mock labware quantity for testing
      const { getByText } = render(props)
      getByText('MOCK_LEFT_COL_LABWARE_INFO')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH,
    },
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH,
    },
  ])('renders HoldingLabware', ({ route, step }) => {
    it(`for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('MOCK_HOLDING_LABWARE')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RELEASE_FROM_LATCH,
    },
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH,
    },
  ])('renders ReleaseLabware', ({ route, step }) => {
    it(`for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('MOCK_RELEASE_LABWARE')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.RETRY,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.RETRY,
    },
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.STEPS.RETRY,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RETRY,
    },
  ])('renders RetryStepInfo', ({ route, step }) => {
    it(`for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('MOCK_RETRY_STEP_INFO')
    })
  })
  describe.each([
    {
      route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.SKIP,
    },
    {
      route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.STEPS.SKIP,
    },
    {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP,
    },
  ])('renders SkipStepInfo', ({ route, step }) => {
    it(`for ${route} route and ${step} step`, () => {
      props.recoveryMap = { route, step }
      const { getByText } = render(props)
      getByText('MOCK_SKIP_STEP_INFO')
    })
  })
})
