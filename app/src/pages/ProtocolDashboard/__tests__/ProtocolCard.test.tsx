import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UseQueryResult } from 'react-query'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ProtocolCard } from '../ProtocolCard'

import type { ProtocolResource } from '@opentrons/shared-data'
import type { ProtocolAnalyses } from '@opentrons/api-client'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})
jest.mock('@opentrons/react-api-client')

const mockUseProtocolAnalysesQuery = useProtocolAnalysesQuery as jest.MockedFunction<
  typeof useProtocolAnalysesQuery
>

const mockProtocol: ProtocolResource = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  protocolType: 'json',
  robotType: 'OT-3 Standard',
  metadata: {
    protocolName: 'yay mock protocol',
    author: 'engineering',
    description: 'A short mock protocol',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}

const props = {
  protocol: mockProtocol,
  longPress: jest.fn(),
  setTargetProtocol: jest.fn(),
  setShowDeleteConfirmationModal: jest.fn(),
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolCard', () => {
  jest.useFakeTimers()

  beforeEach(() => {
    mockUseProtocolAnalysesQuery.mockReturnValue({
      data: { data: [{ result: 'ok' }] } as any,
    } as UseQueryResult<ProtocolAnalyses>)
  })
  it('should redirect to protocol details after short click', () => {
    const [{ getByText }] = render()
    const name = getByText('yay mock protocol')
    fireEvent.click(name)
    expect(mockPush).toHaveBeenCalledWith('/protocols/mockProtocol1')
  })

  it('should display the analysis failed error modal when clicking on the protocol', () => {
    mockUseProtocolAnalysesQuery.mockReturnValue({
      data: { data: [{ result: 'error' }] } as any,
    } as UseQueryResult<ProtocolAnalyses>)
    const [{ getByText, getByLabelText, queryByText }] = render()
    getByLabelText('failedAnalysis_icon')
    getByText('Failed analysis')
    getByText('yay mock protocol').click()
    getByText('Protocol analysis failed')
    getByText(
      'Delete the protocol, make changes to address the error, and resend the protocol to this robot from the Opentrons App.'
    )
    getByText('Delete protocol')
    getByLabelText('closeIcon').click()
    expect(queryByText('Protocol analysis failed')).not.toBeInTheDocument()
  })

  it('should display modal after long click', async () => {
    const [{ getByText }] = render()
    const name = getByText('yay mock protocol')
    fireEvent.mouseDown(name)
    jest.advanceTimersByTime(1005)
    expect(props.longPress).toHaveBeenCalled()
    getByText('Run protocol')
    getByText('Pin protocol')
    getByText('Delete protocol')
  })

  it('should display modal after long click even when analysis failed', async () => {
    mockUseProtocolAnalysesQuery.mockReturnValue({
      data: { data: [{ result: 'error' }] } as any,
    } as UseQueryResult<ProtocolAnalyses>)
    const [{ getByText }] = render()
    const name = getByText('yay mock protocol')
    fireEvent.mouseDown(name)
    jest.advanceTimersByTime(1005)
    expect(props.longPress).toHaveBeenCalled()
    getByText('Run protocol')
    getByText('Pin protocol')
    getByText('Delete protocol')
  })
})
