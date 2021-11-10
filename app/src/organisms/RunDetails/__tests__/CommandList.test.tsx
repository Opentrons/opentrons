import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/dom'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { useProtocolDetails } from '../hooks'
import { ProtocolSetupInfo } from '../ProtocolSetupInfo'
import { CommandList } from '../CommandList'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { schemaV6Adapter } from '@opentrons/shared-data/js/helpers/schemaV6Adapter'
import fixtureAnalysis from '@opentrons/app/src/organisms/RunDetails/Fixture_analysis.json'
import { CommandItem } from '../CommandItem'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../ProtocolSetupInfo')
jest.mock('../CommandItem')
jest.mock('@opentrons/shared-data/js/helpers/schemaV6Adapter')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockProtocolSetupInfo = ProtocolSetupInfo as jest.MockedFunction<
  typeof ProtocolSetupInfo
>
const mockSchemaV6Adapter = schemaV6Adapter as jest.MockedFunction<
  typeof schemaV6Adapter
>
const mockCommandItem = CommandItem as jest.MockedFunction<typeof CommandItem>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>
const _fixtureAnalysis = (fixtureAnalysis as unknown) as ProtocolFile<{}>

const render = (props: React.ComponentProps<typeof CommandList>) => {
  return renderWithProviders(<CommandList {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CommandList', () => {
  let props: React.ComponentProps<typeof CommandList>

  beforeEach(() => {
    props = {
      inProgress: 'pickUpTip',
      completed: 'aspirate',
      anticipated: 'dispense',
    }
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    mockProtocolSetupInfo.mockReturnValue(<div>Mock ProtocolSetup Info</div>)

    mockSchemaV6Adapter.mockReturnValue(_fixtureAnalysis)

    when(mockCommandItem).mockReturnValue(
      <div>Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1</div>
    )
  })
  it('renders null if protocol data is null', () => {
    mockUseProtocolDetails.mockReturnValue({ protocolData: null } as any)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders Protocol Setup title expands Protocol setup when clicked and end of protocol text', () => {
    const { getAllByText, getByText } = render(props)
    getByText('Protocol Setup')
    fireEvent.click(getByText('Protocol Setup'))
    getAllByText('Mock ProtocolSetup Info')
    getByText('End of protocol')
  })
  it('renders the first non ProtocolSetup command', () => {
    const { getAllByText } = render(props)
    getAllByText('Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1')
  })
})
