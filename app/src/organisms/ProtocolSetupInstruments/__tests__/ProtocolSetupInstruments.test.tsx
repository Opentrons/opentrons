import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'

import {
  useCreateLiveCommandMutation,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'

import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupInstruments } from '..'
import {
  mockRecentAnalysis,
  mockUseModulesQueryClosing,
  mockUseModulesQueryOpen,
  mockUseModulesQueryOpening,
  mockUseModulesQueryUnknown,
} from '../__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data/js/helpers')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>

const RUN_ID = "otie's run"
const mockSetSetupScreen = jest.fn()
const mockRefetch = jest.fn()
const mockCreateLiveCommand = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolSetupInstruments
        runId={RUN_ID}
        setSetupScreen={mockSetSetupScreen}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolSetupInstruments', () => {
  beforeEach(() => {
    mockCreateLiveCommand.mockResolvedValue(null)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRecentAnalysis)
    when(mockGetDeckDefFromRobotType)
      .calledWith('OT-3 Standard')
      .mockReturnValue(ot3StandardDeckDef as any)
    mockUseModulesQuery.mockReturnValue({
      ...mockUseModulesQueryOpen,
      refetch: mockRefetch,
    } as any)
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders the Labware Setup page', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Labware')
    getByText('Labware Name')
    getByText('Location')
    getByRole('button', { name: 'continue' })
    getByRole('button', { name: 'Deck Map' })
  })

  it('correctly navigates with the nav buttons', () => {
    const [{ getByRole, getAllByRole }] = render()
    getByRole('button', { name: 'continue' }).click()
    expect(mockSetSetupScreen).toHaveBeenCalledWith('prepare to run')
    getAllByRole('button')[0].click()
    expect(mockSetSetupScreen).toHaveBeenCalledWith('modules')
  })
})
