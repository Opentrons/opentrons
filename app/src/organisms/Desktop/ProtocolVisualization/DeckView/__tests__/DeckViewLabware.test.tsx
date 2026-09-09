import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
} from '@opentrons/shared-data'

import { DeckViewLabware } from '../DeckViewLabware'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    LabwareRender: vi.fn(
      ({ definition }: { definition: LabwareDefinition2 }) => (
        <div>{definition.metadata.displayName}</div>
      )
    ),
    CenterLabwareInSlot: vi.fn(({ children }) => <>{children}</>),
  }
})

vi.mock('../../utils/getActiveLayer', () => ({
  getActiveLayer: () => ({ isActiveLayerVisible: false }),
}))

vi.mock('../DeckViewOverlay', () => ({
  DeckViewOverlay: vi.fn(({ children }) => <g>{children}</g>),
}))

vi.mock('../LabwareCommandSummary', () => ({
  LabwareCommandSummary: () => null,
}))

const LID_ID = 'tiprackLid'
const DECK_LID_ID = 'deckLid'
const LID_DISPLAY_NAME = 'Opentrons Flex Tip Rack Lid'
const DECK_LID_DISPLAY_NAME = 'Deck Tip Rack Lid'

const createLidDef = (displayName: string): LabwareDefinition2 =>
  ({
    schemaVersion: 2,
    version: 1,
    namespace: 'opentrons',
    metadata: {
      displayName,
      displayCategory: 'other',
      displayVolumeUnits: 'µL',
    },
    dimensions: { xDimension: 127.76, yDimension: 85.48, zDimension: 10 },
    cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
    parameters: {
      format: 'irregular',
      isTiprack: false,
      loadName: 'opentrons_flex_tiprack_lid',
      isMagneticModuleCompatible: false,
    },
    wells: {},
    ordering: [],
    groups: [],
  }) as LabwareDefinition2

const renderDeckViewLabware = (
  props: ComponentProps<typeof DeckViewLabware>
): ReturnType<typeof render> =>
  render(<svg>{<DeckViewLabware {...props} />}</svg>)

describe('DeckViewLabware disposed labware', () => {
  let props: ComponentProps<typeof DeckViewLabware>

  beforeEach(() => {
    const lidDef = createLidDef(LID_DISPLAY_NAME)
    const deckLidDef = createLidDef(DECK_LID_DISPLAY_NAME)
    const robotState = {
      labware: {
        [LID_ID]: {
          stack: [LID_ID, GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA],
        },
        [DECK_LID_ID]: {
          stack: [DECK_LID_ID, 'C2'],
        },
      },
      pipettes: {},
      modules: {},
      tipState: { tipracks: {}, pipettes: {} },
      liquidState: { labware: {}, pipettes: {}, trashBins: {}, wasteChute: {} },
    } as RobotState

    props = {
      robotState,
      invariantContext: {
        labwareEntities: {},
        moduleEntities: {},
        pipetteEntities: {},
        trashBinEntities: {},
        wasteChuteEntities: {},
        stagingAreaEntities: {},
        gripperEntities: {},
        config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: false },
      } as InvariantContext,
      liquids: [],
      deckDef: getDeckDefFromRobotType(FLEX_ROBOT_TYPE),
      robotType: FLEX_ROBOT_TYPE,
      labwareEntitiesExtended: {
        [LID_ID]: {
          id: LID_ID,
          labwareDefURI: 'opentrons/opentrons_flex_tiprack_lid/1',
          def: lidDef,
          pythonName: 'lid_1',
          nickName: null,
        },
        [DECK_LID_ID]: {
          id: DECK_LID_ID,
          labwareDefURI: 'opentrons/opentrons_flex_tiprack_lid/1',
          def: deckLidDef,
          pythonName: 'lid_2',
          nickName: null,
        },
      },
      setSelectedSlot: vi.fn(),
      setHoveredSlot: vi.fn(),
      hoveredSlot: null,
      selectedSlot: null,
    }
  })

  it('does not render a tip rack lid stacked on the gripper waste chute', () => {
    renderDeckViewLabware(props)

    expect(screen.queryByText(LID_DISPLAY_NAME)).not.toBeInTheDocument()
    expect(screen.getAllByText(DECK_LID_DISPLAY_NAME).length).toBeGreaterThan(0)
  })
})
