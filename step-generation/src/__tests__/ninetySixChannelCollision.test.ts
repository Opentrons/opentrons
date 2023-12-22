import { getIsTallLabwareWestOf96Channel } from '../utils/ninetySixChannelCollision'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { RobotState, InvariantContext } from '../types'

let invariantContext: InvariantContext
let robotState: RobotState

const mockSourceId = 'sourceId'
const mockWestId = 'westId'
const mockPipetteId = 'pipetteId'
const mockTiprackId = 'tiprackId'
const mockSourceDef: LabwareDefinition2 = {
  dimensions: { zDimension: 100 },
} as any
const mockWestDef: LabwareDefinition2 = {
  dimensions: { zDimension: 90 },
} as any
const mockWestDefTall: LabwareDefinition2 = {
  dimensions: { zDimension: 101 },
} as any
const mockTiprackDefinition: LabwareDefinition2 = {
  parameters: { tipLength: 10 },
} as any
describe('getIsTallLabwareWestOf96Channel ', () => {
  beforeEach(() => {
    invariantContext = {
      labwareEntities: {
        [mockSourceId]: {
          id: mockSourceId,
          labwareDefURI: 'mockDefUri',
          def: mockSourceDef,
        },
      },
      additionalEquipmentEntities: {},
      moduleEntities: {},
      config: {} as any,
      pipetteEntities: {
        [mockPipetteId]: {
          name: 'p1000_96',
          id: mockPipetteId,
          tiprackDefURI: ['mockUri'],
          tiprackLabwareDef: [mockTiprackDefinition],
          spec: {} as any,
        },
      },
    }
    robotState = {
      labware: { [mockSourceId]: { slot: 'A1' } },
      pipettes: {},
      modules: {},
      tipState: { pipettes: { [mockPipetteId]: false } } as any,
      liquidState: {} as any,
    }
  })
  it('should return false when the slot is in column is 1', () => {
    expect(
      getIsTallLabwareWestOf96Channel(
        robotState,
        invariantContext,
        mockSourceId,
        mockPipetteId,
        mockTiprackId
      )
    ).toBe(false)
  })
  it('should return false when source id is a waste chute', () => {
    invariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {
        [mockSourceId]: {
          id: mockSourceId,
          name: 'wasteChute',
          location: 'D3',
        },
      },
    }
    expect(
      getIsTallLabwareWestOf96Channel(
        robotState,
        invariantContext,
        mockSourceId,
        mockPipetteId,
        mockTiprackId
      )
    ).toBe(false)
  })
  it('should return false when there is no labware west of source labware', () => {
    robotState.labware = { [mockSourceId]: { slot: 'A2' } }
    expect(
      getIsTallLabwareWestOf96Channel(
        robotState,
        invariantContext,
        mockSourceId,
        mockPipetteId,
        mockTiprackId
      )
    ).toBe(false)
  })
  it('should return false when the west labware height is not tall enough', () => {
    invariantContext.labwareEntities = {
      ...invariantContext.labwareEntities,
      [mockWestId]: {
        id: mockWestId,
        labwareDefURI: 'mockDefUri',
        def: mockWestDef,
      },
    }
    robotState.labware = {
      [mockSourceId]: { slot: 'A2' },
      [mockWestId]: { slot: 'A1' },
    }
    expect(
      getIsTallLabwareWestOf96Channel(
        robotState,
        invariantContext,
        mockSourceId,
        mockPipetteId,
        mockTiprackId
      )
    ).toBe(false)
  })
  it('should return true when the west labware height is tall enough', () => {
    invariantContext.labwareEntities = {
      ...invariantContext.labwareEntities,
      [mockWestId]: {
        id: mockWestId,
        labwareDefURI: 'mockDefUri',
        def: mockWestDefTall,
      },
    }
    robotState.labware = {
      [mockSourceId]: { slot: 'A2' },
      [mockWestId]: { slot: 'A1' },
    }
    expect(
      getIsTallLabwareWestOf96Channel(
        robotState,
        invariantContext,
        mockSourceId,
        mockPipetteId,
        mockTiprackId
      )
    ).toBe(true)
  })
})
