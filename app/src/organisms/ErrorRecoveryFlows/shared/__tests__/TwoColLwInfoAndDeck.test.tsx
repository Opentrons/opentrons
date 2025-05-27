import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MoveLabwareOnDeck } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { getSlotNameAndLwLocFrom } from '../../hooks/useDeckMapUtils'
import { LeftColumnLabwareInfo } from '../LeftColumnLabwareInfo'
import { TwoColLwInfoAndDeck } from '../TwoColLwInfoAndDeck'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    MoveLabwareOnDeck: vi.fn(),
  }
})
vi.mock('../LeftColumnLabwareInfo')
vi.mock('../../hooks/useDeckMapUtils')

let mockProceedNextStep: Mock
let mockManualRetrieve: Mock

const render = (props: ComponentProps<typeof TwoColLwInfoAndDeck>) => {
  return renderWithProviders(<TwoColLwInfoAndDeck {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TwoColLwInfoAndDeck', () => {
  let props: ComponentProps<typeof TwoColLwInfoAndDeck>

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockManualRetrieve = vi.fn().mockResolvedValue(undefined)
    props = {
      routeUpdateActions: {
        proceedNextStep: mockProceedNextStep,
      },
      failedPipetteUtils: {
        failedPipetteInfo: { data: { channels: 8 } },
        isPartialTipConfigValid: false,
      },
      failedLabwareUtils: {
        relevantWellName: 'A1',
        relevantPickUpTipWellName: 'A1',
        failedLabware: { location: 'C1' },
        relevantPickUpTipLabware: { id: 'some-id' },
        relevantPickUpTipLwLocs: {
          displayNameCurrentLoc: 'Slot C1',
        },
        failedLabwareLocations: {
          newLoc: {},
          currentLoc: {},
          displayNameCurrentLoc: 'Slot C1',
        },
      },
      deckMapUtils: {
        movedLabwareDef: {},
        moduleRenderInfo: [],
        labwareRenderInfo: [],
      },
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
      },
      isOnDevice: true,
      recoveryMap: {
        route: RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
        step:
          RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE,
      },
      recoveryCommands: {
        manualRetrieve: mockManualRetrieve,
      },
    } as any

    vi.mocked(LeftColumnLabwareInfo).mockReturnValue(
      vi.fn(() => <div data-testid="mock-left-column-labware-info" />) as any
    )
    vi.mocked(getSlotNameAndLwLocFrom).mockReturnValue(['C1'] as any)
  })

  it('calls proceedNextStep when primary button is clicked', () => {
    render(props)
    clickButtonLabeled('Continue')
    expect(mockProceedNextStep).toHaveBeenCalled()
  })

  it('calls manualRetrieve and then proceedNextStep when primary button is clicked for flex stacker retrieve options', async () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.STEPS.HOPPER_MANUAL_REPLACE
    render(props)
    clickButtonLabeled('Continue')
    await waitFor(() => {
      expect(mockManualRetrieve).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockProceedNextStep).toHaveBeenCalled()
    })
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE}`, () => {
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Manually move labware on deck',
        type: 'location-arrow-location',
        bannerText:
          'Ensure labware is accurately placed in the slot to prevent further errors.',
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE}`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Manually replace labware on deck',
        type: 'location',
        bannerText:
          'Ensure labware is accurately placed in the slot to prevent further errors.',
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE}`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Replace used tips in rack location A1 in Slot C1',
        type: 'location',
        bannerText:
          "It's best to replace tips and select the last location used for tip pickup.",
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE}`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Replace used tips in rack location A1 in Slot C1',
        type: 'location',
        bannerText:
          "It's best to replace tips and select the last location used for tip pickup.",
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE}`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ensure stacker has labware',
        type: 'location',
        bannerText:
          'Make sure you load the correct number of labware into the stacker.',
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE} with manual replace step`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Load labware into labware shuttle',
        type: 'location',
        bannerText: null,
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE} with NOT manual replace step`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ensure stacker has labware',
        type: 'location',
        bannerText:
          'Make sure you load the correct number of labware into the stacker.',
      }),
      expect.anything()
    )
  })

  it(`passes correct title to LeftColumnLabwareInfo for ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE} with NOT manual replace step`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_RETRY
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ensure stacker has labware',
        type: 'location',
        bannerText:
          'Make sure you load the correct number of labware into the stacker.',
      }),
      expect.anything()
    )
  })

  it('passes correct title to LeftColumnLabwareInfo for 96-channel pipette', () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE
    // @ts-expect-error This is a test. It's always defined.
    props.failedPipetteUtils.failedPipetteInfo.data.channels = 96
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Replace with new tip rack in Slot C1',
        type: 'location',
        bannerText:
          "It's best to replace tips and select the last location used for tip pickup.",
      }),
      expect.anything()
    )
  })

  it('passes correct title to LeftColumnLabwareInfo for partial tip config', () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE
    props.failedPipetteUtils.isPartialTipConfigValid = true
    render(props)
    expect(vi.mocked(LeftColumnLabwareInfo)).toHaveBeenCalledWith(
      expect.objectContaining({
        bannerText:
          'Replace tips and select the last location used for partial tip pickup.',
      }),
      expect.anything()
    )
  })

  it(`renders a move labware on deck view if the selected recovery option is ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE} and props are valid`, () => {
    vi.mocked(MoveLabwareOnDeck).mockReturnValue(
      <div>MOCK_MOVE_LW_ON_DECK</div>
    )

    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE
    render(props)

    screen.getByText('MOCK_MOVE_LW_ON_DECK')
  })

  it(`does not render a move labware on deck view if the selected recovery option is ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE} and props are invalid`, () => {
    vi.mocked(MoveLabwareOnDeck).mockReturnValue(
      <div>MOCK_MOVE_LW_ON_DECK</div>
    )

    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE
    props.deckMapUtils = {
      movedLabwareDef: null,
      moduleRenderInfo: null,
      labwareRenderInfo: null,
    } as any

    render(props)

    expect(screen.queryByText('MOCK_MOVE_LW_ON_DECK')).not.toBeInTheDocument()
  })
})
