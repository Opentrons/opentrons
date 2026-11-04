import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { LabwareSlot } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'
import type { LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  ModuleEntities,
  RobotState,
} from '@opentrons/step-generation'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    LabwareRender: vi.fn(() => <div>mock LabwareRender</div>),
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
    props = {
      topLabwareOnSlotId: MOCK_LABWARE_ID,
      labwareEntities: createMockLabwareEntities(),
      commands: [createMockLoadLabwareCommand()],
      liquids: [],
      robotState: createMockRobotState(),
      moduleEntities: {} as ModuleEntities,
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
})
