import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  HoldingLabware,
  ReleaseLabware,
  SkipStepInfo,
  StackerEmptyHopper,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerReengageLatch,
  StackerShuttleLwInfo,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { StackerShuttleEmptySkip } from '../StackerShuttleEmptySkip'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (props: ComponentProps<typeof StackerShuttleEmptySkip>) => {
  return renderWithProviders(<StackerShuttleEmptySkip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StackerShuttleEmptySkip', () => {
  let props: ComponentProps<typeof StackerShuttleEmptySkip>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      currentRecoveryOptionUtils: {
        ...mockRecoveryContentProps.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      },
    }
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(StackerEmptyHopper).mockReturnValue(
      <div>MOCK_STACKER_EMPTY_HOPPER</div>
    )
    vi.mocked(StackerHomeShuttle).mockReturnValue(
      <div>MOCK_STACKER_HOME_SHUTTLE</div>
    )
    vi.mocked(HoldingLabware).mockReturnValue(<div>MOCK_HOLDING_LABWARE</div>)
    vi.mocked(ReleaseLabware).mockReturnValue(<div>MOCK_RELEASE_LABWARE</div>)
    vi.mocked(StackerReengageLatch).mockReturnValue(
      <div>MOCK_STACKER_REENGAGE_LATCH</div>
    )
    vi.mocked(StackerShuttleLwInfo).mockReturnValue(
      <div>MOCK_STACKER_SHUTTLE_LW_INFO</div>
    )
    vi.mocked(StackerHopperLwInfo).mockReturnValue(
      <div>MOCK_STACKER_HOPPER_LW_INFO</div>
    )
    vi.mocked(SkipStepInfo).mockReturnValue(<div>MOCK_SKIP_STEP_INFO</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders StackerEmptyHopper when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER
    render(props)
    screen.getByText('MOCK_STACKER_EMPTY_HOPPER')
  })

  it(`renders StackerHomeShuttle when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING
    render(props)
    screen.getByText('MOCK_STACKER_HOME_SHUTTLE')
  })

  it(`renders HoldingLabware when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH
    render(props)
    screen.getByText('MOCK_HOLDING_LABWARE')
  })

  it(`renders StackerHomeShuttle when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH
    render(props)
    screen.getByText('MOCK_RELEASE_LABWARE')
  })

  it(`renders StackerReengageLatch when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH
    render(props)
    screen.getByText('MOCK_STACKER_REENGAGE_LATCH')
  })

  it(`renders StackerReengageLatch when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE
    render(props)
    screen.getByText('MOCK_STACKER_SHUTTLE_LW_INFO')
  })

  it(`renders StackerHopperLwInfo when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER
    render(props)
    screen.getByText('MOCK_STACKER_HOPPER_LW_INFO')
  })

  it(`renders SkipStepInfo when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP}`, () => {
    props.recoveryMap.step = RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP
    render(props)
    screen.getByText('MOCK_SKIP_STEP_INFO')
  })

  it(`renders SelectRecoveryOption for unknown step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})
