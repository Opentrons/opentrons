import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
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
import {
  EnableDevTools,
  OT2AdvancedSettings,
  PreventRobotCaching,
  U2EInformation,
  ShowHeaterShakerAttachmentModal,
} from '../../../organisms/AdvancedSettings'

import { AdvancedSettings } from '../AdvancedSettings'

jest.mock('../../../redux/config')
jest.mock('../../../redux/calibration')
jest.mock('../../../redux/custom-labware')
jest.mock('../../../redux/discovery')
jest.mock('../../../redux/protocol-analysis')
jest.mock('../../../redux/system-info')
jest.mock('@opentrons/components/src/hooks')
jest.mock('../../../redux/analytics')
jest.mock('../../../organisms/AdvancedSettings')

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

const mockGetPathToPythonOverride = Config.getPathToPythonOverride as jest.MockedFunction<
  typeof Config.getPathToPythonOverride
>

const mockOpenPythonInterpreterDirectory = ProtocolAnalysis.openPythonInterpreterDirectory as jest.MockedFunction<
  typeof ProtocolAnalysis.openPythonInterpreterDirectory
>

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockPreventRobotCaching = PreventRobotCaching as jest.MockedFunction<
  typeof PreventRobotCaching
>

const mockOT2AdvancedSettings = OT2AdvancedSettings as jest.MockedFunction<
  typeof OT2AdvancedSettings
>
const mockEnableDevTools = EnableDevTools as jest.MockedFunction<
  typeof EnableDevTools
>
const mockU2EInformation = U2EInformation as jest.MockedFunction<
  typeof U2EInformation
>
const mockShowHeaterShakerAttachmentModal = ShowHeaterShakerAttachmentModal as jest.MockedFunction<
  typeof ShowHeaterShakerAttachmentModal
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
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockUseConditionalConfirm.mockReturnValue({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })
    mockPreventRobotCaching.mockReturnValue(<div>mock PreventRobotCaching</div>)
    mockOT2AdvancedSettings.mockReturnValue(<div>mock OT2AdvancedSettings</div>)
    mockEnableDevTools.mockReturnValue(<div>mock EnableDevTools</div>)
    mockU2EInformation.mockReturnValue(<div>mock U2EInformation</div>)
    mockShowHeaterShakerAttachmentModal.mockReturnValue(
      <div>mock ShowHeaterShakerAttachmentModal</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct titles', () => {
    const [{ getByText }] = render()
    getByText('Update Channel')
    getByText('Additional Custom Labware Source Folder')
    getByText('Clear Unavailable Robots')
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
  it('should render mock OT-2 Advanced Settings Tip Length Calibration Method section', () => {
    render()
    screen.getByText('mock OT2AdvancedSettings')
  })

  it('should render mock robot caching section', () => {
    render()
    screen.getByText('mock PreventRobotCaching')
  })

  it('should render mock U2EInformation', () => {
    render()
    expect(screen.getByText('mock U2EInformation'))
  })

  it('renders the display show link to get labware offset data section', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Show Labware Offset data code snippets')
    getByText(
      'Only for users who need to apply Labware Offset data outside of the Opentrons App. When enabled, code snippets for Jupyter Notebook and SSH are available during protocol setup.'
    )
    getByRole('switch', { name: 'show_link_to_get_labware_offset_data' })
  })

  it('renders the toggle button on when show link to labware offset data setting is true', () => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'show_link_to_get_labware_offset_data',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should render mock ShowHeaterShakerAttachmentModal section', () => {
    render()
    screen.getByText('mock ShowHeaterShakerAttachmentModal')
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

  it('should render mock developer tools section', () => {
    render()
    screen.getByText('mock EnableDevTools')
  })
})
