import * as React from 'react'
import { renderWithProviders, useInterval } from '@opentrons/components'
import { useModulesQuery, usePipettesQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { Banner } from '../../../atoms/Banner'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import {
  useIsRobotViewable,
  useRunStatuses,
  usePipetteOffsetCalibrations,
} from '../hooks'
import { ModuleCard } from '../../ModuleCard'
import { InstrumentsAndModules } from '../InstrumentsAndModules'
import { PipetteCard } from '../PipetteCard'
import { getIs96ChannelPipetteAttached } from '../utils'

import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../redux/calibration/pipette-offset/__fixtures__'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    useInterval: jest.fn(),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('../hooks')
jest.mock('../../ModuleCard')
jest.mock('../PipetteCard')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../../atoms/Banner')
jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getIs96ChannelPipetteAttached: jest.fn(),
  }
})
jest.mock('../../RunTimeControl/hooks')

const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>
const mockUsePipetteOffsetCalibrations = usePipetteOffsetCalibrations as jest.MockedFunction<
  typeof usePipetteOffsetCalibrations
>
const mockUseInterval = useInterval as jest.MockedFunction<typeof useInterval>
const mockModuleCard = ModuleCard as jest.MockedFunction<typeof ModuleCard>
const mockPipetteCard = PipetteCard as jest.MockedFunction<typeof PipetteCard>
const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockBanner = Banner as jest.MockedFunction<typeof Banner>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockGetIs96ChannelPipetteAttached = getIs96ChannelPipetteAttached as jest.MockedFunction<
  typeof getIs96ChannelPipetteAttached
>

const render = () => {
  return renderWithProviders(<InstrumentsAndModules robotName="otie" />, {
    i18nInstance: i18n,
  })
}

const INTERVAL_FREQUENT = 1000
const INTERVAL_LESS_FREQUENT = 30000

describe('InstrumentsAndModules', () => {
  beforeEach(() => {
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunIdle: false,
      isRunStill: true,
      isRunTerminal: false,
    })
    mockGetIs96ChannelPipetteAttached.mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an empty state message when robot is not on the network', () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    const [{ getByText }] = render()

    getByText(
      'Robot must be on the network to see connected instruments and modules'
    )
  })

  it('renders a Module card when a robot is viewable', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    const [{ getByText }] = render()

    getByText('Mock ModuleCard')
  })
  it('renders pipette cards when a robot is viewable', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    const [{ getAllByText }] = render()
    getAllByText('Mock PipetteCard')
  })
  it('renders the protocol loaded banner when protocol is loaded and not terminal state', () => {
    mockUseCurrentRunId.mockReturnValue('RUNID')
    mockBanner.mockReturnValue(<div>mock Banner</div>)
    const [{ getByText }] = render()

    getByText('mock Banner')
  })
  it('renders 1 pipette card when a 96 channel is attached', () => {
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockGetIs96ChannelPipetteAttached.mockReturnValue(true)
    mockUseIsRobotViewable.mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('Mock PipetteCard')
  })
  it('fetches offset calibrations status more frequently when calibrations do not exist', () => {
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: {
          id: 'uncalibrated1',
          name: `test-uncalibrated1`,
          model: 'p10_single_v1',
          tip_length: 0,
          mount_axis: 'z',
          plunger_axis: 'b',
        },
        right: {
          id: 'uncalibrated2',
          name: `test-uncalibrated2`,
          model: 'p10_single_v1',
          tip_length: 0,
          mount_axis: 'y',
          plunger_axis: 'a',
        },
      },
    } as any)
    mockUsePipetteOffsetCalibrations.mockReturnValue(null)
    render()
    expect(mockUseInterval.mock.calls[0][1]).toBe(INTERVAL_FREQUENT)
  })
  it('fetches offset calibrations status more frequently when calibrations do not exist for every pipette', () => {
    const { pipette: pipette1 } = mockPipetteOffsetCalibration1
    const { pipette: pipette2 } = mockPipetteOffsetCalibration2

    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: {
          id: pipette1,
          name: `test-${pipette1}`,
          model: 'p10_single_v1',
          tip_length: 0,
          mount_axis: 'z',
          plunger_axis: 'b',
        },
        right: {
          id: pipette2,
          name: `test-${pipette2}`,
          model: 'p10_single_v1',
          tip_length: 0,
          mount_axis: 'y',
          plunger_axis: 'a',
        },
      },
    } as any)
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
    ])
    render()
    expect(mockUseInterval.mock.calls[0][1]).toBe(INTERVAL_FREQUENT)
  })
  it('fetches offset calibrations status less frequently when calibrations exist for every pipette', () => {
    const { pipette: pipette1 } = mockPipetteOffsetCalibration1
    const { pipette: pipette2 } = mockPipetteOffsetCalibration2

    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: {
          id: pipette1,
          name: `test-${pipette1}`,
          model: 'p10_single_v1',
          tip_length: 0,
          mount_axis: 'z',
          plunger_axis: 'b',
        },
        right: {
          id: pipette2,
          name: `test-${pipette2}`,
          model: 'p10_single_v1',
          tip_length: 0,
          mount_axis: 'y',
          plunger_axis: 'a',
        },
      },
    } as any)
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
    ])
    render()
    expect(mockUseInterval.mock.calls[0][1]).toBe(INTERVAL_LESS_FREQUENT)
  })
})
