import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import {
  useInstrumentsQuery,
  useModulesQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ModuleCard } from '/app/organisms/ModuleCard'
import { useIsFlex } from '/app/redux-resources/robots'
import { mockMagneticModule } from '@opentrons/api-client'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useCurrentRunId, useRunStatuses } from '/app/resources/runs'
import { getShowPipetteCalibrationWarning } from '/app/transformations/instruments'

import { GripperCard } from '../GripperCard'
import { InstrumentsAndModules } from '../InstrumentsAndModules'
import { FlexPipetteCard } from '../PipetteCard/FlexPipetteCard'
import { PipetteRecalibrationWarning } from '../PipetteCard/PipetteRecalibrationWarning'

import type { ComponentProps } from 'react'
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
vi.mock('../PipetteCard/FlexPipetteCard')
vi.mock('../PipetteCard/PipetteRecalibrationWarning')
vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/transformations/instruments')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')

const ROBOT_NAME = 'otie'

const render = (props: ComponentProps<typeof InstrumentsAndModules>) => {
  return renderWithProviders(<InstrumentsAndModules {...props} />, {
    i18nInstance: i18n,
  })
}

describe('InstrumentsAndModules', () => {
  let props: ComponentProps<typeof InstrumentsAndModules>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      isRobotViewable: true,
    }
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
    render({ ...props, isRobotViewable: false })

    screen.getByText(
      'Robot must be on the network to see connected instruments, modules, and peripherals'
    )
  })

  it('renders a Module card when a robot is viewable', () => {
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    vi.mocked(usePipettesQuery).mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    render(props)
    expect(vi.mocked(ModuleCard)).toHaveBeenCalled()
  })
  it('renders gripper and flex pipette cards when a robot is Flex', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)

    render(props)
    expect(vi.mocked(GripperCard)).toHaveBeenCalled()
    expect(vi.mocked(FlexPipetteCard)).toHaveBeenCalledTimes(2)
  })
  it('renders the protocol loaded banner when protocol is loaded and not terminal state', () => {
    vi.mocked(useCurrentRunId).mockReturnValue('RUNID')
    render({ ...props })
    screen.getByText(
      'Some robot controls are not available when run is in progress'
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

    render(props)
    expect(vi.mocked(FlexPipetteCard)).toHaveBeenCalledTimes(1)
  })
  it('renders pipette recalibration recommendation banner when offsets fail reasonability checks', () => {
    vi.mocked(getShowPipetteCalibrationWarning).mockReturnValue(true)

    render(props)
    expect(vi.mocked(PipetteRecalibrationWarning)).toHaveBeenCalled()
  })
  it('fetches instruments and modules on short poll for flex', () => {
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    render(props)
    expect(useModulesQuery).toHaveBeenCalledWith({ refetchInterval: 5000 })
    expect(useInstrumentsQuery).toHaveBeenCalledWith({
      refetchInterval: 5000,
      enabled: true,
    })
  })
})
