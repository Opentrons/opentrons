import { when } from 'vitest-when'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import {
  useModulesQuery,
  useInstrumentsQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
import { mockMagneticModule } from '/app/redux/modules/__fixtures__'
import { useIsFlex, useIsRobotViewable } from '/app/redux-resources/robots'
import { ModuleCard } from '/app/organisms/ModuleCard'
import { InstrumentsAndModules } from '../InstrumentsAndModules'
import { GripperCard } from '../GripperCard'
import { PipetteCard } from '../PipetteCard'
import { FlexPipetteCard } from '../PipetteCard/FlexPipetteCard'
import { PipetteRecalibrationWarning } from '../PipetteCard/PipetteRecalibrationWarning'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useCurrentRunId, useRunStatuses } from '/app/resources/runs'
import type * as Components from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof Components>()
  return {
    ...actualComponents,
    useInterval: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../GripperCard')
vi.mock('/app/organisms/ModuleCard')
vi.mock('../PipetteCard')
vi.mock('../PipetteCard/FlexPipetteCard')
vi.mock('../PipetteCard/PipetteRecalibrationWarning')
vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/transformations/instruments')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')

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
    screen.getByText(
      'Robot must be on the network to see connected instruments and modules'
    )
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
