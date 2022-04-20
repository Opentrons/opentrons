import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { getShellUpdateState } from '../../../../redux/shell'
import { AboutRobotName } from '../AdvancedTab/AboutRobotName'
import { DisableHoming } from '../AdvancedTab/DisableHoming'
import { FactoryReset } from '../AdvancedTab/FactoryReset'
import { LegacySettings } from '../AdvancedTab/LegacySettings'
import { OpenJupyterControl } from '../AdvancedTab/OpenJupyterControl'
import { RobotInformation } from '../AdvancedTab/RobotInformation'
import { RobotServerVersion } from '../AdvancedTab/RobotServerVersion'
import { ShortTrashBin } from '../AdvancedTab/ShortTrashBin'
import { Troubleshooting } from '../AdvancedTab/Troubleshooting'
import { UpdateRobotSoftware } from '../AdvancedTab/UpdateRobotSoftware'
import { UsageSettings } from '../AdvancedTab/UsageSettings'
import { UseOlderAspirateBehavior } from '../AdvancedTab/UseOlderAspirateBehavior'
import { UseOlderProtocol } from '../AdvancedTab/UseOlderProtocol'

import { RobotSettingsAdvanced } from '../RobotSettingsAdvanced'

import { State } from '../../../../redux/types'
import { ShellUpdateState } from '../../../../redux/shell/types'

jest.mock('../../../../redux/robot-settings/selectors')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../../../redux/shell/update', () => ({
  ...jest.requireActual<{}>('../../../../redux/shell/update'),
  getShellUpdateState: jest.fn(),
}))
jest.mock('../AdvancedTab/AboutRobotName')
jest.mock('../AdvancedTab/DisableHoming')
jest.mock('../AdvancedTab/FactoryReset')
jest.mock('../AdvancedTab/LegacySettings')
jest.mock('../AdvancedTab/OpenJupyterControl')
jest.mock('../AdvancedTab/RobotInformation')
jest.mock('../AdvancedTab/RobotServerVersion')
jest.mock('../AdvancedTab/ShortTrashBin')
jest.mock('../AdvancedTab/Troubleshooting')
jest.mock('../AdvancedTab/UpdateRobotSoftware')
jest.mock('../AdvancedTab/UsageSettings')
jest.mock('../AdvancedTab/UseOlderAspirateBehavior')
jest.mock('../AdvancedTab/UseOlderProtocol')

const mockGetShellUpdateState = getShellUpdateState as jest.MockedFunction<
  typeof getShellUpdateState
>

const mockAboutRobotName = AboutRobotName as jest.MockedFunction<
  typeof AboutRobotName
>
const mockDisableHoming = DisableHoming as jest.MockedFunction<
  typeof DisableHoming
>
const mockFactoryReset = FactoryReset as jest.MockedFunction<
  typeof FactoryReset
>
const mockLegacySettings = LegacySettings as jest.MockedFunction<
  typeof LegacySettings
>
const mockOpenJupyterControl = OpenJupyterControl as jest.MockedFunction<
  typeof OpenJupyterControl
>
const mockRobotInformation = RobotInformation as jest.MockedFunction<
  typeof RobotInformation
>
const mockRobotServerVersion = RobotServerVersion as jest.MockedFunction<
  typeof RobotServerVersion
>
const mockShortTrashBin = ShortTrashBin as jest.MockedFunction<
  typeof ShortTrashBin
>
const mockTroubleshooting = Troubleshooting as jest.MockedFunction<
  typeof Troubleshooting
>
const mockUpdateRobotSoftware = UpdateRobotSoftware as jest.MockedFunction<
  typeof UpdateRobotSoftware
>
const mockUsageSettings = UsageSettings as jest.MockedFunction<
  typeof UsageSettings
>
const mockUseOlderAspirateBehavior = UseOlderAspirateBehavior as jest.MockedFunction<
  typeof UseOlderAspirateBehavior
>
const mockUseOlderProtocol = UseOlderProtocol as jest.MockedFunction<
  typeof UseOlderProtocol
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsAdvanced robotName="otie" />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettings Advanced tab', () => {
  beforeEach(() => {
    // mockGetShellUpdateState.mockImplementation((state: State) => {
    //   return {
    //     info: {
    //       version: '1.2.3',
    //       releaseNotes: 'this is a release',
    //     },
    //   } as ShellUpdateState
    // })
    mockGetShellUpdateState.mockReturnValue({
      downloading: true,
    } as ShellUpdateState)
    mockAboutRobotName.mockReturnValue(<div>Mock AboutRobotName Section</div>)
    mockDisableHoming.mockReturnValue(<div>Mock DisableHoming</div>)
    mockFactoryReset.mockReturnValue(<div>Mock FactoryReset</div>)
    mockLegacySettings.mockReturnValue(<div>Mock LegacySettings</div>)
    mockOpenJupyterControl.mockReturnValue(<div>Mock OpenJupyterControl</div>)
    mockRobotInformation.mockReturnValue(<div>Mock RobotInformation</div>)
    mockRobotServerVersion.mockReturnValue(<div>Mock RobotServerVersion</div>)
    mockShortTrashBin.mockReturnValue(<div>Mock ShortTrashBin</div>)
    mockTroubleshooting.mockReturnValue(<div>Mock Troubleshooting</div>)
    mockUpdateRobotSoftware.mockReturnValue(<div>Mock UpdateRobotSoftware</div>)
    mockUsageSettings.mockReturnValue(<div>Mock UsageSettings</div>)
    mockUseOlderAspirateBehavior.mockReturnValue(
      <div>Mock UseOlderAspirateBehavior</div>
    )
    mockUseOlderProtocol.mockReturnValue(<div>Mock UseOlderProtocol</div>)
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  // TODO: test cases
  it('should render AboutRobotName section', () => {
    const [{ getByText }] = render()
    getByText('Mock AboutRobotName Section')
  })
})
