import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  simpleAnalysisFileFixture,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getIsProtocolAnalysisInProgress } from '/app/redux/protocol-storage'
import { storedProtocolData } from '/app/redux/protocol-storage/__fixtures__'

import { ProtocolCard } from '../ProtocolCard'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type {
  AnalysisError,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { StoredProtocolData } from '/app/redux/protocol-storage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('/app/redux/protocol-storage', async importOriginal => {
  const actual = await importOriginal<typeof getIsProtocolAnalysisInProgress>()
  return {
    ...actual,
    getIsProtocolAnalysisInProgress: vi.fn(),
  }
})

vi.mock('../ProtocolOverflowMenu', () => ({
  ProtocolOverflowMenu: vi.fn(() => <div>mock protocol overflow menu</div>),
}))

vi.mock('../../ProtocolAnalysisFailure', () => ({
  ProtocolAnalysisFailure: vi.fn(({ errors }: { errors: string[] }) => (
    <div>{errors.join(', ')}</div>
  )),
}))

vi.mock('../../ProtocolAnalysisFailure/ProtocolAnalysisStale', () => ({
  ProtocolAnalysisStale: vi.fn(() => <div>mock protocol analysis stale</div>),
}))

vi.mock('../../ProtocolStatusBanner', () => ({
  ProtocolStatusBanner: vi.fn(() => <div>mock protocol status banner</div>),
}))

const makeStoredProtocolData = (
  analysis: Partial<ProtocolAnalysisOutput>
): StoredProtocolData => ({
  ...storedProtocolData,
  mostRecentAnalysis: {
    ...simpleAnalysisFileFixture,
    metadata: { protocolName: 'Mock Protocol' },
    ...analysis,
  } as ProtocolAnalysisOutput,
})

const render = (props: ComponentProps<typeof ProtocolCard>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('ProtocolCard', () => {
  let props: ComponentProps<typeof ProtocolCard>

  beforeEach(() => {
    props = {
      handleRunProtocol: vi.fn(),
      handleSendProtocolToFlex: vi.fn(),
      storedProtocolData: makeStoredProtocolData({
        robotType: FLEX_ROBOT_TYPE,
        errors: [],
      }),
    }
    vi.mocked(getIsProtocolAnalysisInProgress).mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders protocol information and overflow menu', () => {
    render(props)

    screen.getByText('Mock Protocol')
    screen.getByText('mock protocol overflow menu')
    screen.getByText('P300 Single-Channel GEN2')
    screen.getByText('Modules')
  })

  it('navigates when clicking an Flex protocol card', () => {
    render(props)

    fireEvent.click(screen.getByText('Mock Protocol'))

    expect(mockNavigate).toHaveBeenCalledWith('/protocols/protocolKeyStub')
  })

  it('does not navigate for OT2 protocol', () => {
    const INVALID_ROBOT_TYPE_ERROR =
      'This protocol is designed for an OT-2 robot.'
    const ot2Error: AnalysisError = {
      id: 'ot2-error-id',
      detail: INVALID_ROBOT_TYPE_ERROR,
      errorType: 'analysis',
      createdAt: '2026-04-15T00:00:00Z',
    }

    render({
      ...props,
      storedProtocolData: makeStoredProtocolData({
        robotType: OT2_ROBOT_TYPE,
        errors: [ot2Error],
      }),
    })

    screen.getByTestId('InlineNotification_alert')
    screen.getByText('Get the app')

    fireEvent.click(screen.getByText('Mock Protocol'))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders loading state while analysis is in progress', () => {
    vi.mocked(getIsProtocolAnalysisInProgress).mockReturnValue(true)

    render(props)

    screen.getByText('Loading data...')
  })
})
