import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  renderWithProviders,
  useConditionalConfirm,
} from '@opentrons/components'
import {
  getReachableRobots,
  getUnreachableRobots,
} from '../../../redux/discovery'
import { i18n } from '../../../i18n'
import {
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
  ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
} from '../../../redux/analytics'
import * as CustomLabware from '../../../redux/custom-labware'
import * as Config from '../../../redux/config'
import * as ProtocolAnalysis from '../../../redux/protocol-analysis'
import * as SystemInfo from '../../../redux/system-info'
import * as Fixtures from '../../../redux/system-info/__fixtures__'

import { AdvancedSettings } from '../AdvancedSettings'

jest.mock('../../../redux/config')
jest.mock('../../../redux/calibration')
jest.mock('../../../redux/custom-labware')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/protocol-analysis')
jest.mock('../../../redux/system-info')
jest.mock('@opentrons/components/src/hooks')
jest.mock('../../../redux/analytics')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <MemoryRouter>
      <AdvancedSettings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockGetUnreachableRobots = getUnreachableRobots as jest.MockedFunction<
  typeof getUnreachableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockUseConditionalConfirm = useConditionalConfirm as jest.MockedFunction<
  typeof useConditionalConfirm
>
const getCustomLabwarePath = CustomLabware.getCustomLabwareDirectory as jest.MockedFunction<
  typeof CustomLabware.getCustomLabwareDirectory
>
const getChannelOptions = Config.getUpdateChannelOptions as jest.MockedFunction<
  typeof Config.getUpdateChannelOptions
>

const mockGetIsLabwareOffsetCodeSnippetsOn = Config.getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof Config.getIsLabwareOffsetCodeSnippetsOn
>

const mockGetU2EAdapterDevice = SystemInfo.getU2EAdapterDevice as jest.MockedFunction<
  typeof SystemInfo.getU2EAdapterDevice
>

const mockGetU2EWindowsDriverStatus = SystemInfo.getU2EWindowsDriverStatus as jest.MockedFunction<
  typeof SystemInfo.getU2EWindowsDriverStatus
>

const mockGetIsHeaterShakerAttached = Config.getIsHeaterShakerAttached as jest.MockedFunction<
  typeof Config.getIsHeaterShakerAttached
>

const mockGetPathToPythonOverride = Config.getPathToPythonOverride as jest.MockedFunction<
  typeof Config.getPathToPythonOverride
>

const mockOpenPythonInterpreterDirectory = ProtocolAnalysis.openPythonInterpreterDirectory as jest.MockedFunction<
  typeof ProtocolAnalysis.openPythonInterpreterDirectory
>

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const mockUseFeatureFlag = Config.useFeatureFlag as jest.MockedFunction<
  typeof Config.useFeatureFlag
>

let mockTrackEvent: jest.Mock
const mockConfirm = jest.fn()
const mockCancel = jest.fn()

describe('AdvancedSettings', () => {
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    getCustomLabwarePath.mockReturnValue('')
    getChannelOptions.mockReturnValue([
      {
        label: 'Stable',
        value: 'latest',
      },
      { label: 'Beta', value: 'beta' },
      { label: 'Alpha', value: 'alpha' },
    ])
    mockGetU2EAdapterDevice.mockReturnValue(Fixtures.mockWindowsRealtekDevice)
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetU2EWindowsDriverStatus.mockReturnValue(SystemInfo.OUTDATED)
    mockUseConditionalConfirm.mockReturnValue({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })
    when(mockUseFeatureFlag)
      .calledWith('enableExtendedHardware')
      .mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct titles', () => {
    const [{ getByText }] = render()
    getByText('Update Channel')
    getByText('Additional Custom Labware Source Folder')
    getByText('Prevent Robot Caching')
    getByText('Clear Unavailable Robots')
    getByText('Enable Developer Tools')
    getByText('OT-2 Advanced Settings')
    getByText('Tip Length Calibration Method')
    getByText('USB-to-Ethernet Adapter Information')
  })
  it('renders the update channel combobox and section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Stable receives the latest stable releases. Beta allows you to try out new in-progress features before they launch in Stable channel, but they have not completed testing yet.'
    )
    getByRole('combobox', { name: '' })
  })
  it('renders the custom labware section with source folder selected', () => {
    getCustomLabwarePath.mockReturnValue('/mock/custom-labware-path')
    const [{ getByText, getByRole }] = render()
    getByText(
      'If you want to specify a folder to manually manage Custom Labware files, you can add the directory here.'
    )
    getByText('Additional Source Folder')
    getByRole('button', { name: 'Change labware source folder' })
  })
  it('renders the custom labware section with no source folder selected', () => {
    const [{ getByText, getByRole }] = render()
    getByText('No additional source folder specified')
    const btn = getByRole('button', { name: 'Add labware source folder' })
    fireEvent.click(btn)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
      properties: {},
    })
  })
  it('renders the tip length cal section', () => {
    const [{ getByRole }] = render()
    getByRole('radio', { name: 'Always use calibration block to calibrate' })
    getByRole('radio', { name: 'Always use trash bin to calibrate' })
    getByRole('radio', {
      name: 'Always show the prompt to choose calibration block or trash bin',
    })
  })
  it('renders the robot caching section', () => {
    const [{ queryByText, getByRole }] = render()
    queryByText(
      'The app will immediately clear unavailable robots and will not remember unavailable robots while this is enabled. On networks with many robots, preventing caching may improve network performance at the expense of slower and less reliable robot discovery on app launch.'
    )
    getByRole('switch', { name: 'display_unavailable_robots' })
  })

  it('render the usb-to-ethernet adapter information', () => {
    const [{ getByText }] = render()
    getByText('USB-to-Ethernet Adapter Information')
    getByText(
      'Some OT-2s have an internal USB-to-Ethernet adapter. If your OT-2 uses this adapter, it will be added to your computer’s device list when you make a wired connection. If you have a Realtek adapter, it is essential that the driver is up to date.'
    )
    getByText('Description')
    getByText('Manufacturer')
    getByText('Driver Version')
  })

  it('renders the test data of the usb-to-ethernet adapter information with mac', () => {
    mockGetU2EAdapterDevice.mockReturnValue({
      ...Fixtures.mockRealtekDevice,
    })
    mockGetU2EWindowsDriverStatus.mockReturnValue(SystemInfo.NOT_APPLICABLE)
    const [{ getByText, queryByText }] = render()
    getByText('USB 10/100 LAN')
    getByText('Realtek')
    getByText('Unknown')
    expect(
      queryByText(
        'An update is available for Realtek USB-to-Ethernet adapter driver'
      )
    ).not.toBeInTheDocument()
    expect(queryByText('go to Realtek.com')).not.toBeInTheDocument()
  })

  it('renders the test data of the outdated usb-to-ethernet adapter information with windows', () => {
    const [{ getByText }] = render()
    getByText('Realtek USB FE Family Controller')
    getByText('Realtek')
    getByText('1.2.3')
    getByText(
      'An update is available for Realtek USB-to-Ethernet adapter driver'
    )
    const targetLink = 'https://www.realtek.com/en/'
    const link = getByText('go to Realtek.com')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('renders the test data of the updated usb-to-ethernet adapter information with windows', () => {
    mockGetU2EWindowsDriverStatus.mockReturnValue(SystemInfo.UP_TO_DATE)
    const [{ getByText, queryByText }] = render()
    getByText('Realtek USB FE Family Controller')
    getByText('Realtek')
    getByText('1.2.3')
    expect(
      queryByText(
        'An update is available for Realtek USB-to-Ethernet adapter driver'
      )
    ).not.toBeInTheDocument()
    expect(queryByText('go to Realtek.com')).not.toBeInTheDocument()
  })

  it('renders the not connected message and not display item titles when USB-to-Ethernet is not connected', () => {
    mockGetU2EAdapterDevice.mockReturnValue(null)
    const [{ getByText, queryByText }] = render()
    expect(queryByText('Description')).not.toBeInTheDocument()
    expect(queryByText('Manufacturer')).not.toBeInTheDocument()
    expect(queryByText('Driver Version')).not.toBeInTheDocument()
    getByText('No USB-to-Ethernet adapter connected')
  })

  it('renders the display show link to get labware offset data section', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Show Labware Offset data code snippets')
    getByText(
      'Only for users who need to apply Labware Offset data outside of the Opentrons App. When enabled, code snippets for Jupyter Notebook and SSH are available during protocol setup.'
    )
    getByRole('switch', { name: 'show_link_to_get_labware_offset_data' })
  })

  it('does not render the allow sending all protocols to ot-3 section when feature flag is off', () => {
    const [{ queryByText, queryByRole }] = render()
    expect(
      queryByText('Allow Sending All Protocols to Opentrons Flex')
    ).toBeNull()
    expect(
      queryByText(
        'Enable the "Send to Opentrons Flex" menu item for each imported protocol, even if protocol analysis fails or does not recognize it as designed for the OT-3.'
      )
    ).toBeNull()
    expect(
      queryByRole('switch', { name: 'allow_sending_all_protocols_to_ot3' })
    ).toBeNull()
  })

  it('renders the allow sending all protocols to ot-3 section when feature flag is on', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableExtendedHardware')
      .mockReturnValue(true)
    const [{ getByText, getByRole }] = render()
    getByText('Allow Sending All Protocols to Opentrons Flex')
    getByText(
      'Enable the "Send to Opentrons Flex" menu item for each imported protocol, even if protocol analysis fails or does not recognize it as designed for the Opentrons Flex.'
    )
    getByRole('switch', { name: 'allow_sending_all_protocols_to_ot3' })
  })

  it('renders the toggle button on when show link to labware offset data setting is true', () => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'show_link_to_get_labware_offset_data',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('renders the toggle button on when showing heater shaker modal as false', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    const [{ getByRole, getByText }] = render()
    getByText('Confirm Heater-Shaker Module Attachment')
    getByText(
      'Display a reminder to attach the Heater-Shaker properly before running a test shake or using it in a protocol.'
    )
    const toggleButton = getByRole('switch', {
      name: 'show_heater_shaker_modal',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('renders the toggle button on when showing heater shaker modal as true', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(false)
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'show_heater_shaker_modal',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('renders the path to python override text and button with no default path', () => {
    mockGetPathToPythonOverride.mockReturnValue(null)
    const [{ getByText, getByRole }] = render()
    getByText('Override Path to Python')
    getByText(
      'If specified, the Opentrons App will use the Python interpreter at this path instead of the default bundled Python interpreter.'
    )
    getByText('override path')
    getByText('No path specified')
    const button = getByRole('button', { name: 'Add override path' })
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
      properties: {},
    })
  })

  it('renders the path to python override text and button with a selected path', () => {
    mockGetPathToPythonOverride.mockReturnValue('otherPath')
    const [{ getByText, getByRole }] = render()
    getByText('Override Path to Python')
    getByText(
      'If specified, the Opentrons App will use the Python interpreter at this path instead of the default bundled Python interpreter.'
    )
    getByText('override path')
    const specifiedPath = getByText('otherPath')
    const button = getByRole('button', { name: 'Reset to default' })
    fireEvent.click(button)
    expect(mockGetPathToPythonOverride).toHaveBeenCalled()
    fireEvent.click(specifiedPath)
    expect(mockOpenPythonInterpreterDirectory).toHaveBeenCalled()
  })

  it('renders the clear unavailable robots section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Clear the list of unavailable robots on the Devices page. This action cannot be undone.'
    )
    const btn = getByRole('button', {
      name: 'Clear unavailable robots list',
    })
    fireEvent.click(btn)
    getByText('Clear unavailable robots?')
    getByText(
      'Clearing the list of unavailable robots on the Devices page cannot be undone.'
    )
    const closeBtn = getByRole('button', {
      name: 'cancel',
    })
    const proceedBtn = getByRole('button', {
      name: 'Clear unavailable robots',
    })
    fireEvent.click(closeBtn)
    expect(mockCancel).toHaveBeenCalled()
    fireEvent.click(proceedBtn)
    expect(mockConfirm).toHaveBeenCalled()
  })
  it('renders the developer tools section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Enabling this setting opens Developer Tools on app launch, enables additional logging and gives access to feature flags.'
    )
    getByRole('switch', { name: 'enable_dev_tools' })
  })
})
