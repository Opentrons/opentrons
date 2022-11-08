import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import fixtureAnalysis from '../../../organisms/RunDetails/__fixtures__/analysis.json'
import runRecord from '../../../organisms/RunDetails/__fixtures__/runRecord.json'
import { useProtocolDetailsForRun } from '../hooks'
import { downloadFile } from '../utils'
import { DownloadRunLogToast } from '../DownloadRunLogToast'

import type { CommandsData, Run } from '@opentrons/api-client'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../hooks')
jest.mock('../utils')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseAllCommandsQuery = useAllCommandsQuery as jest.MockedFunction<
  typeof useAllCommandsQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockDownloadFile = downloadFile as jest.MockedFunction<
  typeof downloadFile
>

const _fixtureAnalysis = (fixtureAnalysis as unknown) as LegacySchemaAdapterOutput

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const PAGE_LENGTH = 101

const render = (props: React.ComponentProps<typeof DownloadRunLogToast>) => {
  return renderWithProviders(<DownloadRunLogToast {...props} />, {
    i18nInstance: i18n,
  })[0]
}

let mockOnClose: jest.Mock

describe('DownloadRunLogToast', () => {
  let props: React.ComponentProps<typeof DownloadRunLogToast>

  beforeEach(() => {
    mockOnClose = jest.fn()
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      onClose: mockOnClose,
      pageLength: PAGE_LENGTH,
    }
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID).mockReturnValue({
      protocolData: _fixtureAnalysis,
      displayName: 'mock display name',
      protocolKey: 'fakeProtocolKey',
      robotType: 'OT-2 Standard',
    })
    when(mockUseAllCommandsQuery)
      .calledWith(
        RUN_ID,
        {
          cursor: 0,
          pageLength: PAGE_LENGTH,
        },
        { staleTime: Infinity }
      )
      .mockReturnValue(({
        data: { data: runRecord.data.commands, meta: { totalLength: 14 } },
      } as unknown) as UseQueryResult<CommandsData>)
    when(mockUseRunQuery)
      .calledWith(RUN_ID, { staleTime: Infinity })
      .mockReturnValue(({
        data: runRecord,
      } as unknown) as UseQueryResult<Run>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('calls download file and closes when command and run data is present', () => {
    render(props)
    expect(mockDownloadFile).toBeCalled()
    expect(mockOnClose).toBeCalled()
  })
  it('renders info toast if command data not present', () => {
    when(mockUseAllCommandsQuery)
      .calledWith(
        RUN_ID,
        {
          cursor: 0,
          pageLength: PAGE_LENGTH,
        },
        { staleTime: Infinity }
      )
      .mockReturnValue({} as UseQueryResult<CommandsData>)
    const { getByText } = render(props)
    getByText('Downloading run log')
  })
  it('renders an error toast if command query errors', () => {
    when(mockUseAllCommandsQuery)
      .calledWith(
        RUN_ID,
        {
          cursor: 0,
          pageLength: PAGE_LENGTH,
        },
        { staleTime: Infinity }
      )
      .mockReturnValue({
        isError: true,
        error: { message: 'it errored' },
      } as UseQueryResult<CommandsData>)
    const { getByText } = render(props)
    getByText('it errored')
  })
})
