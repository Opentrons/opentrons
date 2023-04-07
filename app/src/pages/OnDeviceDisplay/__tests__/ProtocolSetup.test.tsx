import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'

import { i18n } from '../../../i18n'
import { mockRobotSideAnalysis } from '../../../organisms/CommandText/__fixtures__'
import {
  useAttachedModules,
  useRunCreatedAtTimestamp,
} from '../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupLiquids } from '../../../organisms/ProtocolSetupLiquids'
import { getProtocolModulesInfo } from '../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { ProtocolSetupModules } from '../../../organisms/ProtocolSetupModules'
import { getUnmatchedModulesForProtocol } from '../../../organisms/ProtocolSetupModules/utils'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunControls,
  useRunStatus,
} from '../../../organisms/RunTimeControl/hooks'
import { ProtocolSetup } from '../ProtocolSetup'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../../organisms/Devices/hooks')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
jest.mock('../../../organisms/ProtocolSetupModules')
jest.mock('../../../organisms/ProtocolSetupModules/utils')
jest.mock('../../../organisms/RunDetails/ConfirmCancelModal')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../organisms/ProtocolSetupLiquids')

const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseRunCreatedAtTimestamp = useRunCreatedAtTimestamp as jest.MockedFunction<
  typeof useRunCreatedAtTimestamp
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockProtocolSetupModules = ProtocolSetupModules as jest.MockedFunction<
  typeof ProtocolSetupModules
>
const mockGetUnmatchedModulesForProtocol = getUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof getUnmatchedModulesForProtocol
>
const mockConfirmCancelModal = ConfirmCancelModal as jest.MockedFunction<
  typeof ConfirmCancelModal
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockProtocolSetupLiquids = ProtocolSetupLiquids as jest.MockedFunction<
  typeof ProtocolSetupLiquids
>
const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/protocols/:runId/setup/">
        <ProtocolSetup />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const RUN_ID = 'my-run-id'
const CREATED_AT = 'top of the hour'

const mockPlay = jest.fn()

describe('ProtocolSetup', () => {
  beforeEach(() => {
    when(mockUseAttachedModules).calledWith().mockReturnValue([])
    mockProtocolSetupModules.mockReturnValue(
      <div>Mock ProtocolSetupModules</div>
    )
    mockProtocolSetupLiquids.mockReturnValue(
      <div>Mock ProtocolSetupLiquids</div>
    )
    mockConfirmCancelModal.mockReturnValue(<div>Mock ConfirmCancelModal</div>)
    when(mockUseRunControls)
      .calledWith(RUN_ID)
      .mockReturnValue({
        play: mockPlay,
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(({
        modules: [],
        labware: [],
      } as unknown) as CompletedProtocolAnalysis)
    when(mockUseRunCreatedAtTimestamp)
      .calledWith(RUN_ID)
      .mockReturnValue(CREATED_AT)
    when(mockGetProtocolModulesInfo)
      .calledWith(
        ({
          modules: [],
          labware: [],
        } as unknown) as CompletedProtocolAnalysis,
        ot3StandardDeckDef as any
      )
      .mockReturnValue([])
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], [])
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockGetDeckDefFromRobotType)
      .calledWith('OT-3 Standard')
      .mockReturnValue(ot3StandardDeckDef as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text, image, and buttons', () => {
    const [{ getByText, queryByText }] = render(`/protocols/${RUN_ID}/setup/`)
    getByText('Prepare to Run')
    getByText(`Run: ${CREATED_AT}`)
    getByText(`Status: ${RUN_STATUS_IDLE}`)
    getByText('Instruments')
    expect(queryByText('Modules')).toBeNull()
    getByText('Labware')
    getByText('Labware Position Check')
    getByText('Liquids')
  })

  it('should play protocol when click play button', () => {
    const [{ getByRole }] = render(`/protocols/${RUN_ID}/setup/`)
    expect(mockPlay).toBeCalledTimes(0)
    getByRole('button', { name: 'play' }).click()
    expect(mockPlay).toBeCalledTimes(1)
  })

  it('should launch cancel modal when click close button', () => {
    const [{ getByRole, getByText, queryByText }] = render(
      `/protocols/${RUN_ID}/setup/`
    )
    expect(queryByText('Mock ConfirmCancelModal')).toBeNull()
    getByRole('button', { name: 'close' }).click()
    getByText('Mock ConfirmCancelModal')
  })

  it('should launch protocol setup modules screen when click modules', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRobotSideAnalysis)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockRobotSideAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue([])
    const [{ getByText, queryByText }] = render(`/protocols/${RUN_ID}/setup/`)
    expect(queryByText('Mock ProtocolSetupModules')).toBeNull()
    queryByText('Modules')?.click()
    getByText('Mock ProtocolSetupModules')
  })

  it('should launch protocol setup liquids screen when click liquids', () => {
    const [{ getByText, queryByText }] = render(`/protocols/${RUN_ID}/setup/`)
    expect(queryByText('Mock ProtocolSetupLiquids')).toBeNull()
    queryByText('Liquids')?.click()
    getByText('Mock ProtocolSetupLiquids')
  })
})
