import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/dom'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { AlertItem } from '@opentrons/components/src/alerts'
import { useProtocolDetails } from '../hooks'
import {
  useCurrentRunCommands,
  useCurrentRunId,
} from '../../ProtocolUpload/hooks'
import {
  useCurrentRunStatus,
  useCurrentRunErrors,
} from '../../RunTimeControl/hooks'
import { ProtocolSetupInfo } from '../ProtocolSetupInfo'
import { CommandList } from '../CommandList'
import fixtureAnalysis from '../__fixtures__/analysis.json'
import runRecord from '../__fixtures__/runRecord.json'
import { CommandItemComponent as CommandItem } from '../CommandItem'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../ProtocolSetupInfo')
jest.mock('../CommandItem')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('@opentrons/components/src/alerts')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockUseCurrentRunCommands = useCurrentRunCommands as jest.MockedFunction<
  typeof useCurrentRunCommands
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const mockUseCurrentRunErrors = useCurrentRunErrors as jest.MockedFunction<
  typeof useCurrentRunErrors
>
const mockProtocolSetupInfo = ProtocolSetupInfo as jest.MockedFunction<
  typeof ProtocolSetupInfo
>
const mockCommandItem = CommandItem as jest.MockedFunction<typeof CommandItem>

const mockAlertItem = AlertItem as jest.MockedFunction<typeof AlertItem>

const _fixtureAnalysis = (fixtureAnalysis as unknown) as ProtocolFile<{}>

const render = () => {
  return renderWithProviders(<CommandList />, {
    i18nInstance: i18n,
  })[0]
}

describe('CommandList', () => {
  beforeEach(() => {
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      protocolData: _fixtureAnalysis,
      displayName: 'mock display name',
    })
    mockUseCurrentRunCommands.mockReturnValue([])
    mockUseCurrentRunErrors.mockReturnValue([])
    mockUseCurrentRunId.mockReturnValue('fakeRunId')
    mockUseCurrentRunStatus.mockReturnValue('idle')
    mockProtocolSetupInfo.mockReturnValue(<div>Mock ProtocolSetup Info</div>)

    when(mockCommandItem).mockReturnValue(
      <div>Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1</div>
    )
  })
  it('renders null if protocol data is null', () => {
    mockUseProtocolDetails.mockReturnValue({ protocolData: null } as any)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
  it('should render correct Protocol Setup text', () => {
    const { getByText } = render()
    getByText('Protocol Setup')
  })
  it('renders Protocol Setup title expands Protocol setup when clicked and end of protocol text', () => {
    const { getAllByText, getByText } = render()
    fireEvent.click(getByText('Protocol Setup'))
    getAllByText('Mock ProtocolSetup Info')
    getByText('End of protocol')
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
  it('renders only anticipated steps if the current run info is present and has not updated', () => {
    mockUseCurrentRunCommands.mockReturnValue(runRecord.data.commands as any)
    const { getAllByText } = render()
    expect(
      getAllByText(
        'Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1'
      ).length
    ).toEqual(9)
  })
  it('renders the protocol failed banner with errors', () => {
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
    mockUseCurrentRunStatus.mockReturnValue('failed')
    mockUseCurrentRunErrors.mockReturnValue(fixtureErrors)
    mockAlertItem.mockImplementation(({ children }) => (
      <div>
        Protocol Run Failed{' '}
        <div data-testid="test_failed_errors">{children}</div>
      </div>
    ))

    const { getByText, getByTestId } = render()
    expect(getByText('Protocol Run Failed')).toHaveStyle(
      'backgroundColor: Error_light'
    )
    expect(getByText('Protocol Run Failed')).toHaveStyle('color: Error_dark')
    const errors = getByTestId('test_failed_errors')
    expect(errors).toContainHTML(fixtureErrors[0].errorType)
    expect(errors).toContainHTML(fixtureErrors[1].errorType)
  })
  it('renders the protocol canceled banner when the status is stop-requested, without errors shown', () => {
    mockAlertItem.mockImplementation(({ children }) => (
      <div>
        Protocol Run Failed{' '}
        <div data-testid="test_failed_errors">{children}</div>
      </div>
    ))
    const fixtureError = {
      id: 'ac02fd2a-9bd0-47e3-b739-ae562321e71d',
      errorType: 'fakeErrorType',
      createdAt: '2022-02-11T14:58:20.688699+00:00',
      detail: 'fakeErrorDetail',
    }
    mockUseCurrentRunStatus.mockReturnValue('stop-requested')
    mockUseCurrentRunErrors.mockReturnValue([fixtureError])
    mockAlertItem.mockReturnValue(<div>Protocol Run Canceled</div>)
    const { getByText, queryByTestId } = render()
    expect(getByText('Protocol Run Canceled')).toHaveStyle(
      'backgroundColor: Error_light'
    )
    expect(getByText('Protocol Run Canceled')).toHaveStyle('color: Error_dark')
    expect(queryByTestId('test_failed_errors')).toBeNull()
  })
  it('renders the protocol canceled banner when the status is stopped', () => {
    mockUseCurrentRunStatus.mockReturnValue('stopped')
    mockAlertItem.mockReturnValue(<div>Protocol Run Canceled</div>)
    const { getByText } = render()
    expect(getByText('Protocol Run Canceled')).toHaveStyle(
      'backgroundColor: Error_light'
    )
    expect(getByText('Protocol Run Canceled')).toHaveStyle('color: Error_dark')
  })
  it('renders the protocol completed banner', () => {
    mockUseCurrentRunStatus.mockReturnValue('succeeded')
    mockAlertItem.mockReturnValue(<div>Protocol Run Completed</div>)
    const { getByText } = render()
    expect(getByText('Protocol Run Completed')).toHaveStyle(
      'backgroundColor: C_bg_success'
    )
    expect(getByText('Protocol Run Completed')).toHaveStyle('color: C_success')
  })
})
