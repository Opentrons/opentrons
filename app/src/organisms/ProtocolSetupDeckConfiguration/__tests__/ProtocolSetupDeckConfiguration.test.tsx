import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders, BaseDeck } from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupDeckConfiguration } from '..'

jest.mock('@opentrons/components/src/hardware-sim/BaseDeck/index')
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

const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>

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
      cutoutId: 'cutoutD3',
      runId: 'mockRunId',
      setSetupScreen: mockSetSetupScreen,
      providedFixtureOptions: [],
    }
    mockBaseDeck.mockReturnValue(<div>mock BaseDeck</div>)
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
    getByText('mock BaseDeck')
    getByText('Confirm')
  })

  it('should call a mock function when tapping the back button', () => {
    const [{ getByTestId }] = render(props)
    getByTestId('ChildNavigation_Back_Button').click()
    expect(mockSetSetupScreen).toHaveBeenCalledWith('modules')
  })

  it('should call a mock function when tapping confirm button', () => {
    const [{ getByText }] = render(props)
    getByText('Confirm').click()
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })
})
