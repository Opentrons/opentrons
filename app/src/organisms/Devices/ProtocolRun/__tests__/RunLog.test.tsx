import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { fireEvent } from '@testing-library/dom'

import { renderWithProviders } from '@opentrons/components'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import fixtureAnalysis from '../../../../organisms/RunDetails/__fixtures__/analysis.json'
import runRecord from '../../../../organisms/RunDetails/__fixtures__/runRecord.json'
import {
  useRunErrors,
  useRunStatus,
  useRunTimestamps,
} from '../../../../organisms/RunTimeControl/hooks'
import { DownloadRunLogToast } from '../../DownloadRunLogToast'
import { useProtocolDetailsForRun } from '../../hooks'
import { RunLogProtocolSetupInfo } from '../RunLogProtocolSetupInfo'
import { StepItemComponent as StepItem } from '../StepItem'
import { RunLog } from '../RunLog'

import type { CommandsData, Run } from '@opentrons/api-client'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'
import type { RunTimestamps } from '../../../../organisms/RunTimeControl/hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../pages/Labware/helpers/getAllDefs')
jest.mock('../../../../organisms/RunTimeControl/hooks')
jest.mock('../../DownloadRunLogToast')
jest.mock('../../hooks')
jest.mock('../RunLogProtocolSetupInfo')
jest.mock('../StepItem')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseAllCommandsQuery = useAllCommandsQuery as jest.MockedFunction<
  typeof useAllCommandsQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseRunErrors = useRunErrors as jest.MockedFunction<
  typeof useRunErrors
>
const mockUseRunTimestamps = useRunTimestamps as jest.MockedFunction<
  typeof useRunTimestamps
>
const mockRunLogProtocolSetupInfo = RunLogProtocolSetupInfo as jest.MockedFunction<
  typeof RunLogProtocolSetupInfo
>
const mockStepItem = StepItem as jest.MockedFunction<typeof StepItem>
const mockDownloadRunLogToast = DownloadRunLogToast as jest.MockedFunction<
  typeof DownloadRunLogToast
>

const _fixtureAnalysis = (fixtureAnalysis as unknown) as LegacySchemaAdapterOutput

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

const render = () => {
  return renderWithProviders(<RunLog robotName={ROBOT_NAME} runId={RUN_ID} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RunLog', () => {
  beforeEach(() => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID).mockReturnValue({
      protocolData: _fixtureAnalysis,
      displayName: 'mock display name',
      protocolKey: 'fakeProtocolKey',
      robotType: 'OT-2 Standard',
    })
    when(mockUseRunQuery).mockReturnValue(({
      data: { data: { current: true } },
    } as unknown) as UseQueryResult<Run>)
    when(mockUseAllCommandsQuery).mockReturnValue(({
      data: { data: runRecord.data.commands, meta: { totalLength: 14 } },
    } as unknown) as UseQueryResult<CommandsData>)
    when(mockUseRunErrors).calledWith(RUN_ID).mockReturnValue([])
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue('idle')
    when(mockRunLogProtocolSetupInfo).mockReturnValue(
      <div>Mock ProtocolSetup Info</div>
    )

    when(mockStepItem).mockReturnValue(
      <div>Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1</div>
    )
    when(mockDownloadRunLogToast).mockReturnValue(
      <div>Mock DownloadRunLogToast</div>
    )
    when(mockUseRunTimestamps)
      .calledWith(RUN_ID)
      .mockReturnValue({
        startedAt: '2021-03-07T18:44:49.366581+00:00',
      } as RunTimestamps)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders null if protocol data is null', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({ protocolData: null, protocolKey: null } as any)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
  it('renders null if run status is null', () => {
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(null)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
  it('should render run log, number of steps, protocol setup, and end of protocol text', () => {
    const { getByText } = render()
    getByText('Run Log')
    getByText('9 steps total')
    getByText('Protocol Setup')
    getByText('End of protocol')
  })
  it('should render a Download run log button', () => {
    const { getByRole } = render()
    const downloadRunLog = getByRole('button', { name: 'Download run log' })
    downloadRunLog.click()
  })
  it('should expand protocol setup when clicked', () => {
    const { getAllByText, getByText, queryByText } = render()

    expect(queryByText('Mock ProtocolSetup Info')).toBeFalsy()
    fireEvent.click(getByText('Protocol Setup'))
    getAllByText('Mock ProtocolSetup Info')
  })
  it('renders the first non ProtocolSetup command', () => {
    const { getAllByText } = render()
    getAllByText('Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1')
  })
  it('renders all of the protocol analysis steps if the run has not started', () => {
    const { getAllByText } = render()
    expect(
      getAllByText(
        'Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1'
      ).length
    ).toEqual(9)
  })
  it('renders errors for a failed run', () => {
    const fixtureErrors = [
      {
        id: 'b5efe073-09a0-4874-8872-c42554bf15b5',
        errorType: 'LegacyContextCommandError',
        createdAt: '2022-02-11T14:58:20.676355+00:00',
        detail:
          "/dev/ot_module_thermocycler0: 'Received error response 'Error:Plate temperature is not uniform. T1: 35.1097\tT2: 35.8139\tT3: 35.6139\tT4: 35.9809\tT5: 35.4347\tT6: 35.5264\tT.Lid: 20.2052\tT.sink: 19.8993\tT_error: 0.0000\t\r\nLid:open'",
      },
      {
        id: 'ac02fd2a-9bd0-47e3-b739-ae562321e71d',
        errorType: 'ExceptionInProtocolError',
        createdAt: '2022-02-11T14:58:20.688699+00:00',
        detail:
          "ErrorResponse [line 40]: /dev/ot_module_thermocycler0: 'Received error response 'Error:Plate temperature is not uniform. T1: 35.1097\tT2: 35.8139\tT3: 35.6139\tT4: 35.9809\tT5: 35.4347\tT6: 35.5264\tT.Lid: 20.2052\tT.sink: 19.8993\tT_error: 0.0000\t\r\nLid:open'",
      },
    ]
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue('failed')
    when(mockUseRunErrors).calledWith(RUN_ID).mockReturnValue(fixtureErrors)

    const { queryByText } = render()

    queryByText(`${fixtureErrors[0].errorType}: ${fixtureErrors[0].detail}`)
    queryByText(`${fixtureErrors[1].errorType}: ${fixtureErrors[1].detail}`)
  })
  it('renders the download run log toast when download run log clicked', () => {
    const { getByText, queryByText } = render()

    expect(queryByText('Mock DownloadRunLogToast')).toBeNull()
    getByText('Download run log').click()
    getByText('Mock DownloadRunLogToast')
  })
})
