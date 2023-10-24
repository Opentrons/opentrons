import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders, DeckConfigurator } from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupDeckConfiguration } from '..'

jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')
jest.mock('@opentrons/react-api-client')
jest.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')

const mockSetSetupScreen = jest.fn()
const mockUpdateDeckConfiguration = jest.fn()
const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: [],
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-3 Standard' as const,
}

const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>

const render = (
  props: React.ComponentProps<typeof ProtocolSetupDeckConfiguration>
) => {
  return renderWithProviders(<ProtocolSetupDeckConfiguration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupDeckConfiguration', () => {
  let props: React.ComponentProps<typeof ProtocolSetupDeckConfiguration>

  beforeEach(() => {
    props = {
      fixtureLocation: 'D3',
      runId: 'mockRunId',
      setSetupScreen: mockSetSetupScreen,
      providedFixtureOptions: [],
    }
    mockDeckConfigurator.mockReturnValue(<div>mock DeckConfigurator</div>)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith('mockRunId')
      .mockReturnValue(PROTOCOL_DETAILS.protocolData as any)
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render text, button, and DeckConfigurator', () => {
    const [{ getByText }] = render(props)
    getByText('Deck configuration')
    getByText('mock DeckConfigurator')
  })

  it('should call a mock function when tapping the back button', () => {
    const [{ getByTestId }] = render(props)
    getByTestId('ChildNavigation_Back_Button').click()
    expect(mockSetSetupScreen).toHaveBeenCalledWith('modules')
  })
})
