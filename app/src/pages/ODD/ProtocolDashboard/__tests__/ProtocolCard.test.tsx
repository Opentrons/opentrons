import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useDeleteProtocolMutation,
  useMostRecentSuccessfulAnalysisAsDocumentQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useFeatureFlag } from '/app/redux/config'

import { ProtocolCard } from '../ProtocolCard'

import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type { NavigateFunction } from 'react-router-dom'
import type { Chip, UseLongPressResult } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ProtocolResource,
} from '@opentrons/shared-data'

const mockNavigate = vi.fn()
const mockUseLongPress = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/config')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Chip>()
  return {
    ...actual,
    Chip: vi.fn(() => <div>mock Chip</div>),
    useLongPress: () => mockUseLongPress(),
  }
})

const mockProtocol: ProtocolResource = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  protocolType: 'json',
  protocolKind: 'standard',
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

const mockProtocolWithCSV: ProtocolResource = {
  id: 'mockProtocol2',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  protocolType: 'json',
  protocolKind: 'standard',
  robotType: 'OT-3 Standard',
  metadata: {
    protocolName: 'yay mock RTP protocol',
    author: 'engineering',
    description: 'A short mock protocol',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}

const render = (props: ComponentProps<typeof ProtocolCard>) => {
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
  let props: ComponentProps<typeof ProtocolCard>
  let mockLongPress: UseLongPressResult
  vi.useFakeTimers()

  beforeEach(() => {
    mockLongPress = {
      isLongPressed: false,
      isTapped: false,
      isEnabled: true,
      ref: { current: null },
      style: { touchAction: 'none' },
      setIsLongPressed: vi.fn(),
      setIsTapped: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
    }
    mockUseLongPress.mockReturnValue(mockLongPress)

    props = {
      protocol: mockProtocol,
      longPress: vi.fn(),
      setShowDeleteConfirmationModal: vi.fn(),
      setTargetProtocolId: vi.fn(),
      setIsRequiredCSV: vi.fn(),
    }
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'ok' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'ok' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useDeleteProtocolMutation).mockReturnValue({
      deleteProtocol: vi.fn(),
    } as any)
    vi.mocked(useFeatureFlag).mockReturnValue(false)
  })

  it('should redirect to protocol details after short click', () => {
    render(props)
    const name = screen.getByText('yay mock protocol')
    screen.getByTestId('protocol_card')
    fireEvent.click(name)
    expect(mockNavigate).toHaveBeenCalledWith('/protocols/mockProtocol1')
  })

  it('should display the analysis failed error modal when clicking on the protocol', () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'error' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'not-ok', errors: ['some analysis error'] } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    render(props)

    fireEvent.click(screen.getByText('yay mock protocol'))
    screen.getByText('mock Chip')
    screen.getByText(
      'Delete the protocol, make changes to address the error, and resend the protocol to this robot from the Opentrons App.'
    )
    screen.getByText('Delete protocol')
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(
      screen.queryByText('Protocol analysis failed')
    ).not.toBeInTheDocument()
  })

  it('should display modal after long click', async () => {
    mockLongPress.isLongPressed = true
    render(props)

    expect(props.longPress).toHaveBeenCalledWith(true)
    screen.getByText('Run protocol')
    screen.getByText('Pin protocol')
    screen.getByText('Delete protocol')
  })

  it('should display the analysis failed error modal when clicking on the protocol when doing a long pressing', async () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'error' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'not-ok', errors: ['some analysis error'] } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)

    mockLongPress.isLongPressed = true
    render(props)

    expect(props.longPress).toHaveBeenCalledWith(true)
    screen.getByText('mock Chip')
    screen.getByTestId('protocol_card')
    fireEvent.click(screen.getByText('yay mock protocol'))
    screen.getByText('Protocol analysis failed')
    screen.getByText(
      'Delete the protocol, make changes to address the error, and resend the protocol to this robot from the Opentrons App.'
    )
    screen.getByText('Delete protocol')
  })

  it('should display a loading spinner when analysis is pending', async () => {
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: null as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: null as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)

    mockLongPress.isLongPressed = true
    render(props)

    expect(props.longPress).toHaveBeenCalledWith(true)
    screen.getByLabelText('Protocol is loading')
    fireEvent.click(screen.getByText('yay mock protocol'))
  })

  it('should render text, yellow background color, and icon when a protocol requires a csv file', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    vi.mocked(useProtocolAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'parameter-value-required' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    vi.mocked(useMostRecentSuccessfulAnalysisAsDocumentQuery).mockReturnValue({
      data: { result: 'parameter-value-required' } as any,
    } as UseQueryResult<CompletedProtocolAnalysis>)
    render({ ...props, protocol: mockProtocolWithCSV })
    screen.getByText('mock Chip')
    screen.getByTestId('protocol_card')
  })
})
