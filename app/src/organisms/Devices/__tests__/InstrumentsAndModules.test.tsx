import * as React from 'react'
import { when } from 'vitest-when'
import { screen } from '@testing-library/react'
<<<<<<< HEAD
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
=======
import { describe, it, vi, beforeEach, expect } from 'vitest'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import {
  useModulesQuery,
  useInstrumentsQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { Banner } from '../../../atoms/Banner'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useIsFlex, useIsRobotViewable, useRunStatuses } from '../hooks'
import { ModuleCard } from '../../ModuleCard'
import { InstrumentsAndModules } from '../InstrumentsAndModules'
import { GripperCard } from '../../GripperCard'
import { PipetteCard } from '../PipetteCard'
import { FlexPipetteCard } from '../PipetteCard/FlexPipetteCard'
import { PipetteRecalibrationWarning } from '../PipetteCard/PipetteRecalibrationWarning'
<<<<<<< HEAD
import { getShowPipetteCalibrationWarning } from '../utils'
=======
import {
  getIs96ChannelPipetteAttached,
  getShowPipetteCalibrationWarning,
  getOffsetCalibrationForMount,
} from '../utils'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'
import type * as Components from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof Components>()
  return {
    ...actualComponents,
    useInterval: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../hooks')
vi.mock('../../GripperCard')
vi.mock('../../ModuleCard')
vi.mock('../PipetteCard')
<<<<<<< HEAD
vi.mock('../PipetteCard/FlexPipetteCard')
=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
vi.mock('../PipetteCard/PipetteRecalibrationWarning')
vi.mock('../../ProtocolUpload/hooks')
vi.mock('../../../atoms/Banner')
vi.mock('../utils')
vi.mock('../../RunTimeControl/hooks')
vi.mock('../../../resources/devices/hooks/useIsEstopNotDisengaged')

const ROBOT_NAME = 'otie'

const render = () => {
  return renderWithProviders(<InstrumentsAndModules robotName={ROBOT_NAME} />, {
    i18nInstance: i18n,
  })
}

describe('InstrumentsAndModules', () => {
  beforeEach(() => {
    vi.mocked(useCurrentRunId).mockReturnValue(null)
    vi.mocked(useRunStatuses).mockReturnValue({
      isRunRunning: false,
      isRunIdle: false,
      isRunStill: true,
      isRunTerminal: false,
    })
<<<<<<< HEAD
    vi.mocked(getShowPipetteCalibrationWarning).mockReturnValue(false)
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(false)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
=======
    vi.mocked(getIs96ChannelPipetteAttached).mockReturnValue(false)
    vi.mocked(getShowPipetteCalibrationWarning).mockReturnValue(false)
    vi.mocked(getOffsetCalibrationForMount).mockReturnValue(null)
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    vi.mocked(PipetteCard).mockReturnValue(<div>Mock PipetteCard</div>)
    vi.mocked(GripperCard).mockReturnValue(<div>Mock GripperCard</div>)
    vi.mocked(ModuleCard).mockReturnValue(<div>Mock ModuleCard</div>)
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(false)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
    vi.mocked(PipetteRecalibrationWarning).mockReturnValue(
      <div>Mock PipetteRecalibrationWarning</div>
    )
  })
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

  it('renders an empty state message when robot is not on the network', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(false)
    render()

    screen.getByText(
      'Robot must be on the network to see connected instruments and modules'
    )
  })

  it('renders a Module card when a robot is viewable', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    vi.mocked(usePipettesQuery).mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
<<<<<<< HEAD
    render()
    expect(vi.mocked(ModuleCard)).toHaveBeenCalled()
  })
  it('renders pipette cards when a ot2 robot is viewable', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    vi.mocked(usePipettesQuery).mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    render()
    expect(vi.mocked(PipetteCard)).toHaveBeenCalledTimes(2)
  })
  it('renders gripper and flex pipette cards when a robot is Flex', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    render()
    expect(vi.mocked(GripperCard)).toHaveBeenCalled()
    expect(vi.mocked(FlexPipetteCard)).toHaveBeenCalledTimes(2)
  })
  it('renders the protocol loaded banner when protocol is loaded and not terminal state', () => {
    vi.mocked(useCurrentRunId).mockReturnValue('RUNID')
    render()
    expect(vi.mocked(Banner)).toHaveBeenCalled()
  })
  it('renders 1 pipette card when a 96 channel is attached', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [
          {
            ok: true,
            instrumentType: 'pipette',
            mount: 'left',
            data: {
              channels: 96,
            },
          },
        ],
      },
    } as any)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    render()
    expect(vi.mocked(FlexPipetteCard)).toHaveBeenCalledTimes(1)
  })
  it('renders pipette recalibration recommendation banner when offsets fail reasonability checks', () => {
    vi.mocked(getShowPipetteCalibrationWarning).mockReturnValue(true)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    render()
    expect(vi.mocked(PipetteRecalibrationWarning)).toHaveBeenCalled()
  })
  it('fetches pipette and modules on short poll for ot2', () => {
    render()
    expect(usePipettesQuery).toHaveBeenCalledWith(
      {},
      { refetchInterval: 5000, enabled: true }
    )
=======
    render()

    screen.getByText('Mock ModuleCard')
  })
  it('renders pipette cards when a robot is viewable', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    vi.mocked(usePipettesQuery).mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    render()
    screen.getAllByText('Mock PipetteCard')
  })
  it('renders gripper cards when a robot is Flex', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useModulesQuery).mockReturnValue({ data: { data: [] } } as any)
    vi.mocked(usePipettesQuery).mockReturnValue({
      data: { left: null, right: null },
    } as any)
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [instrumentsResponseFixture.data[0]] },
    } as any)
    render()
    screen.getByText('Mock GripperCard')
  })
  it('renders the protocol loaded banner when protocol is loaded and not terminal state', () => {
    vi.mocked(useCurrentRunId).mockReturnValue('RUNID')
    vi.mocked(Banner).mockReturnValue(<div>mock Banner</div>)
    render()

    screen.getByText('mock Banner')
  })
  it('renders 1 pipette card when a 96 channel is attached', () => {
    vi.mocked(getIs96ChannelPipetteAttached).mockReturnValue(true)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    render()
    screen.getByText('Mock PipetteCard')
  })
  it('renders pipette recalibration recommendation banner when offsets fail reasonability checks', () => {
    vi.mocked(getShowPipetteCalibrationWarning).mockReturnValue(true)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    render()
    screen.getByText('Mock PipetteRecalibrationWarning')
  })
  it('fetches offset calibrations on long poll and pipettes, instruments, and modules on short poll', () => {
    const { pipette: pipette1 } = mockPipetteOffsetCalibration1
    const { pipette: pipette2 } = mockPipetteOffsetCalibration2

    vi.mocked(usePipettesQuery).mockReturnValue({
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
    vi.mocked(useAllPipetteOffsetCalibrationsQuery).mockReturnValue({
      data: {
        data: [mockPipetteOffsetCalibration1, mockPipetteOffsetCalibration2],
      },
    } as any)
    render()
    expect(useAllPipetteOffsetCalibrationsQuery).toHaveBeenCalledWith({
      refetchInterval: 30000,
      enabled: true,
    })
    expect(usePipettesQuery).toHaveBeenCalledWith({}, { refetchInterval: 5000 })
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
    expect(useModulesQuery).toHaveBeenCalledWith({ refetchInterval: 5000 })
    expect(useInstrumentsQuery).toHaveBeenCalledWith({
      refetchInterval: 5000,
      enabled: false,
    })
  })
  it('fetches instruments and modules on short poll for flex', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    render()
    expect(usePipettesQuery).toHaveBeenCalledWith(
      {},
      { refetchInterval: 5000, enabled: false }
    )
    expect(useModulesQuery).toHaveBeenCalledWith({ refetchInterval: 5000 })
    expect(useInstrumentsQuery).toHaveBeenCalledWith({
      refetchInterval: 5000,
      enabled: true,
    })
  })
})
