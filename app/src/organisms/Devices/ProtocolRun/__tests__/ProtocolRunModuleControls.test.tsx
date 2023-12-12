import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { i18n } from '../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import {
  CompletedProtocolAnalysis,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { ProtocolRunModuleControls } from '../ProtocolRunModuleControls'
import { ModuleCard } from '../../../ModuleCard'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../../hooks'
import {
  mockMagneticModuleGen2,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
} from '../../../../redux/modules/__fixtures__'
import fixtureAnalysis from '../../../../organisms/RunDetails/__fixtures__/analysis.json'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ModuleCard')
jest.mock('../../hooks')

const mockModuleCard = ModuleCard as jest.MockedFunction<typeof ModuleCard>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const _fixtureAnalysis = (fixtureAnalysis as unknown) as CompletedProtocolAnalysis

const RUN_ID = 'test123'

const mockTempMod = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'temperature_id',
  model: 'temperatureModuleV2' as ModuleModel,
  type: 'temperatureModuleType' as ModuleType,
}
const mockMagMod = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'magmod_id',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
}
const mockHeaterShakerDef = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'heatershaker_id',
  model: 'heaterShakerModuleV1' as ModuleModel,
  type: 'heaterShakerModuleType' as ModuleType,
}

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'thermocycler_id',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}
const MOCK_TC_COORDS = [20, 30, 0]

const render = (
  props: React.ComponentProps<typeof ProtocolRunModuleControls>
) => {
  return renderWithProviders(<ProtocolRunModuleControls {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolRunModuleControls', () => {
  beforeEach(() => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID).mockReturnValue({
      protocolData: _fixtureAnalysis,
      displayName: 'mock display name',
      protocolKey: 'fakeProtocolKey',
      robotType: 'OT-2 Standard',
    })
    when(mockUseInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders a magnetic module card', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [mockMagMod.moduleId]: {
          moduleId: 'magModModuleId',
          x: '0',
          y: '20',
          z: '30',
          moduleDef: mockMagMod,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: mockMagneticModuleGen2,
        },
      } as any)
    when(mockModuleCard).mockReturnValue(<div>mock Magnetic Module Card</div>)
    const { getByText } = render({
      robotName: 'otie',
      runId: 'test123',
    })

    getByText('mock Magnetic Module Card')
  })

  it('renders a temperature module card', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [mockTempMod.moduleId]: {
          moduleId: 'temperatureModuleId',
          x: '0',
          y: '20',
          z: '30',
          moduleDef: mockTempMod,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: mockTemperatureModuleGen2,
        },
      } as any)
    when(mockModuleCard).mockReturnValue(
      <div>mock Temperature Module Card</div>
    )
    const { getByText } = render({
      robotName: 'otie',
      runId: 'test123',
    })

    getByText('mock Temperature Module Card')
  })

  it('renders a thermocycler module card', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [mockTCModule.moduleId]: {
          moduleId: mockTCModule.moduleId,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: mockThermocycler,
        },
      } as any)

    when(mockModuleCard).mockReturnValue(
      <div>mock Thermocycler Module Card</div>
    )

    const { getByText } = render({
      robotName: 'otie',
      runId: 'test123',
    })

    getByText('mock Thermocycler Module Card')
  })

  it('renders a heater-shaker module card', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [mockHeaterShakerDef.moduleId]: {
          moduleId: 'heaterShakerModuleId',
          x: '0',
          y: '20',
          z: '30',
          moduleDef: mockHeaterShakerDef,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: mockHeaterShaker,
        },
      } as any)
    when(mockModuleCard).mockReturnValue(
      <div>mock Heater-Shaker Module Card</div>
    )

    const { getByText } = render({
      robotName: 'otie',
      runId: 'test123',
    })

    getByText('mock Heater-Shaker Module Card')
  })

  it('renders correct text when module is not attached but required for protocol', () => {
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [mockHeaterShakerDef.moduleId]: {
          moduleId: 'heaterShakerModuleId',
          x: '0',
          y: '20',
          z: '30',
          moduleDef: mockHeaterShakerDef,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: null,
        },
      } as any)

    const { getByText } = render({
      robotName: 'otie',
      runId: 'test123',
    })

    getByText('Connect modules to see controls')
  })
})
