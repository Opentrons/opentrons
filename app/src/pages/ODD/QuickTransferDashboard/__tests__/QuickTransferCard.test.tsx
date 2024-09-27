import { vi, it, describe, expect, beforeEach } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  useMostRecentSuccessfulAnalysisAsDocumentQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { QuickTransferCard } from '../QuickTransferCard'
import { LongPressModal } from '../LongPressModal'
import type { NavigateFunction } from 'react-router-dom'
import type { UseQueryResult } from 'react-query'
import type {
  CompletedProtocolAnalysis,
  ProtocolResource,
} from '@opentrons/shared-data'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../LongPressModal')

const mockTransfer: ProtocolResource = {
  protocolKind: 'quick-transfer',
  id: 'mockTransfer1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  protocolType: 'json',
  robotType: 'OT-3 Standard',
  metadata: {
    protocolName: 'yay mock transfer',
    author: 'engineering',
    description: 'A short mock transfer',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}

const props = {
  quickTransfer: mockTransfer,
  longPress: vi.fn(),
  setShowDeleteConfirmationModal: vi.fn(),
  setTargetTransferId: vi.fn(),
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <QuickTransferCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('QuickTransferCard', () => {
  vi.useFakeTimers()

  beforeEach(() => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'ok' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'ok' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
  })
  it('should redirect to quick transfer details after short click', () => {
    render()
    const name = screen.getByText('yay mock transfer')
    fireEvent.click(name)
    expect(mockNavigate).toHaveBeenCalledWith('/quick-transfer/mockTransfer1')
  })

  it('should display the analysis failed error modal when clicking on the transfer', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'error' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'not-ok', errors: ['some analysis error'] } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    render()
    screen.getByLabelText('failedAnalysis_icon')
    screen.getByText('Failed analysis')
    fireEvent.click(screen.getByText('yay mock transfer'))
    screen.getByText('Quick transfer analysis failed')
    screen.getByText(
      'Delete the quick transfer, make changes to address the error, and recreate this transfer on the Flex display.'
    )
    screen.getByText('Delete quick transfer')
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(
      screen.queryByText('Quick transfer analysis failed')
    ).not.toBeInTheDocument()
  })

  it('should display modal after long click', async () => {
    vi.useFakeTimers()
    render()
    const name = screen.getByText('yay mock transfer')
    fireEvent.mouseDown(name)
    act(() => {
      vi.advanceTimersByTime(1005)
    })
    expect(props.longPress).toHaveBeenCalled()
    expect(vi.mocked(LongPressModal)).toHaveBeenCalled()
  })

  it('should display the analysis failed error modal when clicking on the transfer when doing a long pressing', async () => {
    vi.useFakeTimers()
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'error' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'not-ok', errors: ['some analysis error'] } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    render()
    const name = screen.getByText('yay mock transfer')
    fireEvent.mouseDown(name)
    act(() => {
      vi.advanceTimersByTime(1005)
    })
    expect(props.longPress).toHaveBeenCalled()
    screen.getByLabelText('failedAnalysis_icon')
    screen.getByText('Failed analysis')
    fireEvent.click(screen.getByText('yay mock transfer'))
    screen.getByText('Quick transfer analysis failed')
    screen.getByText(
      'Delete the quick transfer, make changes to address the error, and recreate this transfer on the Flex display.'
    )
    screen.getByText('Delete quick transfer')
  })

  it('should display a loading spinner when analysis is pending', async () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: null as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: null as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    render()
    const name = screen.getByText('yay mock transfer')
    fireEvent.mouseDown(name)
    act(() => {
      vi.advanceTimersByTime(1005)
    })
    expect(props.longPress).toHaveBeenCalled()
    screen.getByLabelText('Transfer is loading')
    fireEvent.click(screen.getByText('yay mock transfer'))
  })
})
