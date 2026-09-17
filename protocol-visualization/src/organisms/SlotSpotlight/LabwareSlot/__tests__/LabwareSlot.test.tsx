import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RobotCoordsForeignObject, RobotWorkSpace } from '@opentrons/components'
import { fixture96Plate } from '@opentrons/shared-data'

import { LabwareSlot } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'
import type { LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareEntities, RobotState } from '@opentrons/step-generation'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    LabwareRender: vi.fn(() => <div>mock LabwareRender</div>),
    RobotWorkSpace: vi.fn(actual.RobotWorkSpace),
    RobotCoordsForeignObject: vi.fn(actual.RobotCoordsForeignObject),
  }
})

vi.mock('../../WellContainer', () => ({
  WellContainer: vi.fn(() => <div>mock WellContainer</div>),
}))

vi.mock('../../WellTooltip', () => ({
  WellTooltip: vi.fn(({ children }) => {
    const mockHandlers = {
      makeHandleMouseEnterWell: vi.fn(),
      handleMouseLeaveWell: vi.fn(),
    }
    return <div>{children(mockHandlers)}</div>
  }),
}))

const render = (props: ComponentProps<typeof LabwareSlot>) => {
  return renderWithProviders(<LabwareSlot {...props} />, {
    i18nInstance: i18n,
  })
}

const MOCK_LABWARE_ID = 'mockLabwareId'
const MOCK_SLOT = 'A1'

const createMockLabwareDef = (): LabwareDefinition2 => {
  return {
    ...fixture96Plate,
    metadata: {
      ...fixture96Plate.metadata,
      displayName: 'Mock 96 Well Plate',
    },
  } as LabwareDefinition2
}

const createMockLabwareEntities = (): LabwareEntities => {
  return {
    [MOCK_LABWARE_ID]: {
      id: MOCK_LABWARE_ID,
      labwareDefURI: 'opentrons/fixture_96_plate/1',
      def: createMockLabwareDef(),
      pythonName: 'mock_plate',
    },
  }
}

const createMockRobotState = (): RobotState => {
  return {
    labware: {
      [MOCK_LABWARE_ID]: {
        stack: [MOCK_LABWARE_ID, MOCK_SLOT],
      },
    },
    pipettes: {},
    modules: {},
    liquidState: {
      pipettes: {},
      labware: {},
      trashBins: {},
      wasteChute: {},
    },
    tipState: {
      pipettes: {},
      tipracks: {},
    },
  } as RobotState
}

const createMockLoadLabwareCommand = (): RunTimeCommand => {
  return {
    commandType: 'loadLabware',
    params: {
      location: { slotName: MOCK_SLOT },
      displayName: 'Test Plate',
    },
    result: {
      labwareId: MOCK_LABWARE_ID,
    },
  } as RunTimeCommand
}

describe('LabwareSlot', () => {
  let props: ComponentProps<typeof LabwareSlot>

  beforeEach(() => {
    vi.clearAllMocks()
    props = {
      topLabwareOnSlotId: MOCK_LABWARE_ID,
      labwareEntities: createMockLabwareEntities(),
      commands: [createMockLoadLabwareCommand()],
      liquids: [],
      robotState: createMockRobotState(),
    }
  })

  it('should render labware display name', () => {
    render(props)
    expect(screen.getByText('Mock 96 Well Plate')).toBeInTheDocument()
  })

  it('should render labware nickname when provided', () => {
    render(props)
    expect(screen.getByText('Test Plate')).toBeInTheDocument()
  })

  it('should render display name without nickname when displayName is absent', () => {
    props.commands = []
    render(props)
    expect(screen.getByText('Mock 96 Well Plate')).toBeInTheDocument()
    expect(screen.queryByText('Test Plate')).not.toBeInTheDocument()
  })

  it('should render LabwareRender component', () => {
    render(props)
    expect(screen.getByText('mock LabwareRender')).toBeInTheDocument()
  })

  it('should not render WellContainer when activeWellName is null', () => {
    render(props)
    expect(screen.queryByText('mock WellContainer')).not.toBeInTheDocument()
  })

  it('should render WellContainer when activeWellName is provided', () => {
    props.robotState = {
      ...createMockRobotState(),
      pipettes: {
        mockPipetteId: {
          mount: 'left',
          entityId: MOCK_LABWARE_ID,
          wellName: 'A1',
        },
      },
    }
    render(props)
    expect(screen.getByText('mock LabwareRender')).toBeInTheDocument()
  })

  it('should keep the stacked badge inside the viewBox for short labware', () => {
    const shortLidId = 'shortLidId'
    const shortLidDef = {
      ...fixture96Plate,
      metadata: {
        ...fixture96Plate.metadata,
        displayName: 'Opentrons Flex Tip Rack Lid',
      },
      dimensions: {
        xDimension: 121,
        yDimension: 78.75,
        zDimension: 17,
      },
      wells: {},
      ordering: [],
    } as LabwareDefinition2

    props.topLabwareOnSlotId = shortLidId
    props.labwareEntities = {
      [shortLidId]: {
        id: shortLidId,
        labwareDefURI: 'opentrons/opentrons_flex_tiprack_lid/1',
        def: shortLidDef,
        pythonName: 'mock_lid',
      },
      lidUnderId: {
        id: 'lidUnderId',
        labwareDefURI: 'opentrons/opentrons_flex_tiprack_lid/1',
        def: shortLidDef,
        pythonName: 'mock_lid_under',
      },
    }
    props.commands = []
    props.robotState = {
      ...createMockRobotState(),
      labware: {
        [shortLidId]: {
          stack: [shortLidId, 'lidUnderId', MOCK_SLOT],
        },
        lidUnderId: {
          stack: ['lidUnderId', MOCK_SLOT],
        },
      },
    }

    render(props)
    expect(screen.getByLabelText('stacked')).toBeInTheDocument()
    expect(screen.getByText('Top labware in stack')).toBeInTheDocument()

    expect(RobotWorkSpace).toHaveBeenCalledWith(
      expect.objectContaining({ viewBox: '0 0 133 90.75' }),
      expect.anything()
    )

    expect(RobotCoordsForeignObject).toHaveBeenCalledWith(
      expect.objectContaining({ x: 222, y: 141.5 }),
      expect.anything()
    )

    const badgeScale = 0.5
    const viewBoxWidth = 133
    const viewBoxHeight = 90.75
    const badgeX = 222 * badgeScale
    const badgeY = 141.5 * badgeScale
    // Same relative corner inset as the legacy 235/155 placement on ANSI plates.
    expect(badgeX).toBeCloseTo(111)
    expect(badgeY).toBeCloseTo(70.75)
    expect(badgeX).toBeLessThan(viewBoxWidth)
    expect(badgeY).toBeLessThan(viewBoxHeight)
  })
})
