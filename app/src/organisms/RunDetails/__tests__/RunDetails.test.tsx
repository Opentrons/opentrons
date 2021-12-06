import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { when } from 'jest-when'
import { RunDetails } from '..'
import { i18n } from '../../../i18n'
import { CommandList } from '../CommandList'
import { useProtocolDetails } from '../hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../CommandList')
jest.mock('../../RunTimeControl/hooks')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockCommandList = CommandList as jest.MockedFunction<typeof CommandList>

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>

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

  it('renders the cancel button, button is clickable, and cancel modal is rendered', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(getByText('Are you sure you want to cancel this run?')).toBeTruthy()
    expect(
      getByText(
        'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
      )
    ).toBeTruthy()
    expect(
      getByText(
        'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
      )
    ).toBeTruthy()
    expect(getByText('no, go back')).toBeTruthy()
    expect(getByText('yes, cancel run')).toBeTruthy()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is succeeded', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_SUCCEEDED)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(
      getByText('Are you sure you want to close this protocol?')
    ).toBeTruthy()
    expect(getByText('No, go back')).toBeTruthy()
    expect(getByText('Yes, close now')).toBeTruthy()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is failed', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FAILED)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(
      getByText('Are you sure you want to close this protocol?')
    ).toBeTruthy()
    expect(getByText('No, go back')).toBeTruthy()
    expect(getByText('Yes, close now')).toBeTruthy()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is stopped', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_STOPPED)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(
      getByText('Are you sure you want to close this protocol?')
    ).toBeTruthy()
    expect(getByText('No, go back')).toBeTruthy()
    expect(getByText('Yes, close now')).toBeTruthy()
  })
})
