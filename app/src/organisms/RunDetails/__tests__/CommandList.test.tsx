import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/dom'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { useProtocolDetails } from '../hooks'
import { ProtocolSetupInfo } from '../ProtocolSetupInfo'
import { CommandList } from '../CommandList'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../ProtocolSetupInfo')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockProtocolSetupInfo = ProtocolSetupInfo as jest.MockedFunction<
  typeof ProtocolSetupInfo
>
const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const render = () => {
  return renderWithProviders(<CommandList />, { i18nInstance: i18n })[0]
}

describe('CommandList', () => {
  beforeEach(() => {
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      //  @ts-expect-error commandAnnotations doesn't exist on v5
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    mockProtocolSetupInfo.mockReturnValue(<div>Mock ProtocolSetup Info</div>)
  })
  it('renders null if protocol data is null', () => {
    mockUseProtocolDetails.mockReturnValue({ protocolData: null } as any)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
  it('renders Protocol Setup title expands Protocol setup when clicked and end of protocol text', () => {
    const { getByText } = render()
    getByText('Protocol Setup')
    fireEvent.click(getByText('Protocol Setup'))
    getByText('End of protocol')
  })
  //  TODO: immediately once Shlok's PR is merged, use protocol fixture that has a delay command
  it.todo('renders comment when commandtype is delay')
})
