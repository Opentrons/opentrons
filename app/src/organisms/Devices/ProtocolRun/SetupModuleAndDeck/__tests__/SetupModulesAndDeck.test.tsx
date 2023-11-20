import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { mockTemperatureModule } from '../../../../../redux/modules/__fixtures__'
import { getRequiredDeckConfig } from '../../../../../resources/deck_configuration/utils'
import {
  useIsFlex,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
  useModuleCalibrationStatus,
} from '../../../hooks'
import { SetupModuleAndDeck } from '../index'
import { SetupModulesList } from '../SetupModulesList'
import { SetupModulesMap } from '../SetupModulesMap'
import { SetupFixtureList } from '../SetupFixtureList'

jest.mock('../../../hooks')
jest.mock('../SetupModulesList')
jest.mock('../SetupModulesMap')
jest.mock('../SetupFixtureList')
jest.mock('../../../../../redux/config')
jest.mock('../../../../../resources/deck_configuration/utils')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockUseModuleCalibrationStatus = useModuleCalibrationStatus as jest.MockedFunction<
  typeof useModuleCalibrationStatus
>
const mockSetupModulesList = SetupModulesList as jest.MockedFunction<
  typeof SetupModulesList
>
const mockSetupFixtureList = SetupFixtureList as jest.MockedFunction<
  typeof SetupFixtureList
>
const mockSetupModulesMap = SetupModulesMap as jest.MockedFunction<
  typeof SetupModulesMap
>
const mockGetRequiredDeckConfig = getRequiredDeckConfig as jest.MockedFunction<
  typeof getRequiredDeckConfig
>
const MOCK_ROBOT_NAME = 'otie'
const MOCK_RUN_ID = '1'

const render = (props: React.ComponentProps<typeof SetupModuleAndDeck>) => {
  return renderWithProviders(<SetupModuleAndDeck {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SetupModuleAndDeck', () => {
  let props: React.ComponentProps<typeof SetupModuleAndDeck>
  beforeEach(() => {
    props = {
      robotName: MOCK_ROBOT_NAME,
      runId: MOCK_RUN_ID,
      expandLabwarePositionCheckStep: () => jest.fn(),
      hasModules: true,
      commands: [],
    }
    mockSetupFixtureList.mockReturnValue(<div>Mock setup fixture list</div>)
    mockSetupModulesList.mockReturnValue(<div>Mock setup modules list</div>)
    mockSetupModulesMap.mockReturnValue(<div>Mock setup modules map</div>)
    when(mockUseRunHasStarted).calledWith(MOCK_RUN_ID).mockReturnValue(false)
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    when(mockUseModuleCalibrationStatus)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({ complete: true })
    when(mockUseIsFlex).calledWith(MOCK_ROBOT_NAME).mockReturnValue(false)
    when(mockGetRequiredDeckConfig).mockReturnValue([])
  })

  it('renders the list and map view buttons', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'List View' })
    getByRole('button', { name: 'Map View' })
  })

  it('should render Proceed to labware setup CTA that is enabled', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: 'Proceed to labware position check',
    })
    expect(button).toBeEnabled()
  })

  it('should render a disabled Proceed to labware setup CTA if the protocol requests modules and they are not all attached to the robot', () => {
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({
        missingModuleIds: ['foo'],
        remainingAttachedModules: [mockTemperatureModule],
      })
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: 'Proceed to labware position check',
    })
    expect(button).toBeDisabled()
  })

  it('should render a disabled Proceed to labware setup CTA if the protocol requests modules they are not all calibrated', () => {
    when(mockUseModuleCalibrationStatus)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({ complete: false })
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: 'Proceed to labware position check',
    })
    expect(button).toBeDisabled()
  })

  it('should render the SetupModulesList component when clicking List View', () => {
    const { getByRole, getByText } = render(props)
    const button = getByRole('button', { name: 'List View' })
    fireEvent.click(button)
    getByText('Mock setup modules list')
  })

  it('should render the SetupModulesList and SetupFixtureList component when clicking List View for Flex', () => {
    when(mockUseIsFlex).calledWith(MOCK_ROBOT_NAME).mockReturnValue(true)
    when(mockGetRequiredDeckConfig).mockReturnValue([
      {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: 'trashBinAdapter',
        requiredAddressableAreas: ['movableTrashA1'],
      },
    ])
    const { getByRole, getByText } = render(props)
    const button = getByRole('button', { name: 'List View' })
    fireEvent.click(button)
    getByText('Mock setup modules list')
    getByText('Mock setup fixture list')
  })

  it('should not render the SetupFixtureList component when there are no required fixtures', () => {
    when(mockUseIsFlex).calledWith(MOCK_ROBOT_NAME).mockReturnValue(true)
    const { getByRole, getByText, queryByText } = render(props)
    const button = getByRole('button', { name: 'List View' })
    fireEvent.click(button)
    getByText('Mock setup modules list')
    expect(queryByText('Mock setup fixture list')).toBeNull()
  })

  it('should render the SetupModulesMap component when clicking Map View', () => {
    const { getByRole, getByText } = render(props)
    const button = getByRole('button', { name: 'Map View' })
    fireEvent.click(button)
    getByText('Mock setup modules map')
  })
})
