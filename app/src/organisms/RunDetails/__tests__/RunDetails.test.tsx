import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'
import { renderWithProviders } from '@opentrons/components'
import { when } from 'jest-when'
import { RunDetails } from '..'
import { i18n } from '../../../i18n'
import { CommandList } from '../CommandList'
import { useProtocolDetails } from '../hooks'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../CommandList')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockCommandList = CommandList as jest.MockedFunction<typeof CommandList>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const render = () => {
  return renderWithProviders(<RunDetails />, {
    i18nInstance: i18n,
  })[0]
}

describe('RunDetails', () => {
  beforeEach(() => {
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    when(mockCommandList).mockReturnValue(<div>Mock Command List</div>)
  })
  it('renders protocol title', () => {
    const { getByText } = render()
    getByText('Protocol - mock display name')
  })
  it('renders run detail command component', () => {
    const { getAllByText } = render()
    getAllByText('Mock Command List')
  })
  it('renders the cancel button and is clickable', () => {
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(button).not.toBeNull()
  })
})
