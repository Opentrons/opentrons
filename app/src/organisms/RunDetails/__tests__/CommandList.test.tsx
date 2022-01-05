import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/dom'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { AlertItem } from '@opentrons/components/src/alerts'
import { useCommandDetailsById, useProtocolDetails } from '../hooks'
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { ProtocolSetupInfo } from '../ProtocolSetupInfo'
import { CommandList } from '../CommandList'
import fixtureAnalysis from '@opentrons/app/src/organisms/RunDetails/Fixture_analysis.json'
import fixtureCommandSummary from '@opentrons/app/src/organisms/RunDetails/Fixture_commandSummary.json'
import { CommandItem } from '../CommandItem'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../ProtocolSetupInfo')
jest.mock('../CommandItem')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('@opentrons/components/src/alerts')

const mockUseCommandDetailsById = useCommandDetailsById as jest.MockedFunction<
  typeof useCommandDetailsById
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
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
    mockUseCommandDetailsById.mockReturnValue({})
    mockUseCurrentProtocolRun.mockReturnValue({
      createProtocolRun: () => {},
      protocolRecord: null,
      runRecord: {
        // @ts-expect-error not a full match of RunData type
        data: {
          commands: [],
          actions: [],
        },
      },
    })
    mockUseRunStatus.mockReturnValue('idle')
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
    getByText('Anticipated steps')
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
    // @ts-expect-error not a full match of RunData type
    mockUseCurrentProtocolRun.mockReturnValue(fixtureCommandSummary)
    const { getAllByText } = render()
    expect(
      getAllByText(
        'Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1'
      ).length
    ).toEqual(9)
  })
  it('renders the protocol failed banner', () => {
    mockUseRunStatus.mockReturnValue('failed')
    mockAlertItem.mockReturnValue(<div>Protocol Run Failed</div>)
    const { getByText } = render()
    expect(getByText('Protocol Run Failed')).toHaveStyle(
      'backgroundColor: Error_light'
    )
    expect(getByText('Protocol Run Failed')).toHaveStyle('color: Error_dark')
  })
  it('renders the protocol canceled banner when the status is stop-requested', () => {
    mockUseRunStatus.mockReturnValue('stop-requested')
    mockAlertItem.mockReturnValue(<div>Protocol Run Canceled</div>)
    const { getByText } = render()
    expect(getByText('Protocol Run Canceled')).toHaveStyle(
      'backgroundColor: Error_light'
    )
    expect(getByText('Protocol Run Canceled')).toHaveStyle('color: Error_dark')
  })
  it('renders the protocol canceled banner when the status is stopped', () => {
    mockUseRunStatus.mockReturnValue('stopped')
    mockAlertItem.mockReturnValue(<div>Protocol Run Canceled</div>)
    const { getByText } = render()
    expect(getByText('Protocol Run Canceled')).toHaveStyle(
      'backgroundColor: Error_light'
    )
    expect(getByText('Protocol Run Canceled')).toHaveStyle('color: Error_dark')
  })
  it('renders the protocol completed banner', () => {
    mockUseRunStatus.mockReturnValue('succeeded')
    mockAlertItem.mockReturnValue(<div>Protocol Run Completed</div>)
    const { getByText } = render()
    expect(getByText('Protocol Run Completed')).toHaveStyle(
      'backgroundColor: C_bg_success'
    )
    expect(getByText('Protocol Run Completed')).toHaveStyle('color: C_success')
  })
})
