import * as React from 'react'
import { when } from 'jest-when'
import '@testing-library/jest-dom'
import { StaticRouter } from 'react-router-dom'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'

import { useFeatureFlag } from '../../../redux/config'
import * as robotSelectors from '../../../redux/robot/selectors'
import { getProtocolFilename } from '../../../redux/protocol/selectors'
import { RunDetails } from '../../../organisms/RunDetails'
import { Run } from '../'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/config')
jest.mock('../../../redux/robot/selectors')
jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../organisms/RunDetails')

const mockRunDetails = RunDetails as jest.MockedFunction<typeof RunDetails>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockGetCommands = robotSelectors.getCommands as jest.MockedFunction<
  typeof robotSelectors.getCommands
>
const mockGetSessionStatus = robotSelectors.getSessionStatus as jest.MockedFunction<
  typeof robotSelectors.getSessionStatus
>
const mockGetSessionStatusInfo = robotSelectors.getSessionStatusInfo as jest.MockedFunction<
  typeof robotSelectors.getSessionStatusInfo
>
const mockGetCancelInProgress = robotSelectors.getCancelInProgress as jest.MockedFunction<
  typeof robotSelectors.getCancelInProgress
>
const mockGetSessionLoadInProgress = robotSelectors.getSessionLoadInProgress as jest.MockedFunction<
  typeof robotSelectors.getSessionLoadInProgress
>
const mockGetProtocolFilename = getProtocolFilename as jest.MockedFunction<
  typeof getProtocolFilename
>

const MOCK_STATE: State = { robot: {} } as any

describe('Run Page', () => {
  let render: () => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    when(mockRunDetails)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => <div>Mock Run Details</div>)
    when(mockGetCommands).calledWith(expect.anything()).mockReturnValue([])
    when(mockGetSessionStatus)
      .calledWith(expect.anything())
      .mockReturnValue('loaded')
    when(mockGetSessionStatusInfo)
      .calledWith(expect.anything())
      .mockReturnValue({
        message: null,
        changedAt: null,
        estimatedDuration: null,
        userMessage: null,
      })
    when(mockGetCancelInProgress)
      .calledWith(expect.anything())
      .mockReturnValue(false)
    when(mockGetSessionLoadInProgress)
      .calledWith(expect.anything())
      .mockReturnValue(false)
    when(mockGetProtocolFilename)
      .calledWith(expect.anything())
      .mockReturnValue('fake_protocol_name')

    render = () => {
      return renderWithProviders(
        <StaticRouter>
          <Run />
        </StaticRouter>,
        { i18nInstance: i18n, initialState: MOCK_STATE }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // it('renders legacy run page when usePreProtocolWithoutRPC ff is not set', () => {
  //   when(mockUseFeatureFlag)
  //     .calledWith('preProtocolFlowWithoutRPC')
  //     .mockReturnValue(false)
  //   const { getByText } = render()
  //   expect(mockRunDetails).not.toHaveBeenCalled()
  // })

  it('renders new run page when usePreProtocolWithoutRPC ff is set', () => {
    when(mockUseFeatureFlag)
      .calledWith('preProtocolFlowWithoutRPC')
      .mockReturnValue(true)
    const { getByText } = render()
    getByText('Mock Run Details')
  })
})
