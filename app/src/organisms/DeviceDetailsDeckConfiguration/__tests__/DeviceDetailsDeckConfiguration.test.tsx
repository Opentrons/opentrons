import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach } from 'vitest'

import { DeckConfigurator } from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'

import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useIsRobotViewable, useRunStatuses } from '../../Devices/hooks'
import { DeckFixtureSetupInstructionsModal } from '../DeckFixtureSetupInstructionsModal'
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'
import { DeviceDetailsDeckConfiguration } from '../'
import { useNotifyCurrentMaintenanceRun } from '../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'

import type { MaintenanceRun } from '@opentrons/api-client'

vi.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')
vi.mock('@opentrons/react-api-client')
vi.mock('../DeckFixtureSetupInstructionsModal')
vi.mock('../../Devices/hooks')
vi.mock('../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun')
vi.mock('../../../resources/devices/hooks/useIsEstopNotDisengaged')

const ROBOT_NAME = 'otie'
const mockUpdateDeckConfiguration = vi.fn()
const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}
const mockCurrnetMaintenanceRun = {
  data: { id: 'mockMaintenanceRunId' },
} as MaintenanceRun

const render = (
  props: React.ComponentProps<typeof DeviceDetailsDeckConfiguration>
) => {
  return renderWithProviders(<DeviceDetailsDeckConfiguration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DeviceDetailsDeckConfiguration', () => {
  let props: React.ComponentProps<typeof DeviceDetailsDeckConfiguration>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
    }
    vi.mocked(useDeckConfigurationQuery).mockReturnValue({ data: [] } as any)
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(DeckFixtureSetupInstructionsModal).mockReturnValue(
      <div>mock DeckFixtureSetupInstructionsModal</div>
    )
    when(vi.mocked(DeckConfigurator)).thenReturn(
      <div>mock DeckConfigurator</div>
    )
    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {},
    } as any)
    when(vi.mocked(useIsEstopNotDisengaged))
      .calledWith(ROBOT_NAME)
      .thenReturn(false)
    when(vi.mocked(useIsRobotViewable)).calledWith(ROBOT_NAME).thenReturn(true)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('otie deck configuration')
    screen.getByRole('button', { name: 'Setup Instructions' })
    screen.getByText('Location')
    screen.getByText('Fixture')
    screen.getByText('mock DeckConfigurator')
  })

  it('should render DeckFixtureSetupInstructionsModal when clicking text button', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Setup Instructions' }))
    screen.getByText('mock DeckFixtureSetupInstructionsModal')
  })

  it('should render banner and make deck configurator disabled when running', () => {
    RUN_STATUSES.isRunRunning = true
    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
    when(vi.mocked(DeckConfigurator))
      .calledWith(partialComponentPropsMatcher({ readOnly: true }))
      .thenReturn(<div>disabled mock DeckConfigurator</div>)
    render(props)
    screen.getByText(
      'Deck configuration is not available when run is in progress'
    )
    screen.getByText('disabled mock DeckConfigurator')
  })

  it('should render banner and make deck configurator disabled when a maintenance run exists', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: mockCurrnetMaintenanceRun,
    } as any)
    when(vi.mocked(DeckConfigurator))
      .calledWith(partialComponentPropsMatcher({ readOnly: true }))
      .thenReturn(<div>disabled mock DeckConfigurator</div>)
    render(props)
    screen.getByText(
      'Deck configuration is not available when the robot is busy'
    )
    screen.getByText('disabled mock DeckConfigurator')
  })

  it('should render no deck fixtures, if deck configs are not set', () => {
    when(vi.mocked(useDeckConfigurationQuery))
      .calledWith()
      .thenReturn([] as any)
    render(props)
    screen.getByText('No deck fixtures')
  })

  it('should render disabled deck configurator when e-stop is pressed', () => {
    when(vi.mocked(useIsEstopNotDisengaged))
      .calledWith(ROBOT_NAME)
      .thenReturn(true)
    when(vi.mocked(DeckConfigurator))
      .calledWith(partialComponentPropsMatcher({ readOnly: true }))
      .thenReturn(<div>disabled mock DeckConfigurator</div>)
    render(props)
    screen.getByText('disabled mock DeckConfigurator')
  })

  it('should render not viewable text when robot is not viewable', () => {
    when(vi.mocked(useIsRobotViewable)).calledWith(ROBOT_NAME).thenReturn(false)
    render(props)
    screen.getByText('Robot must be on the network to see deck configuration')
  })
})
