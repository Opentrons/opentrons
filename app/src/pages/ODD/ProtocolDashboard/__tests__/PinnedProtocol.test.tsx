import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COLORS, TYPOGRAPHY } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useFeatureFlag } from '/app/redux/config'

import { PinnedProtocol } from '../PinnedProtocol'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

const mockNavigate = vi.fn()
const mockUseLongPress = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
vi.mock('/app/redux/config')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    Chip: () => <div>mock Chip</div>,
    useLongPress: () => mockUseLongPress(),
  }
})

const mockProtocol: ProtocolResource = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  robotType: 'OT-3 Standard',
  protocolType: 'json',
  protocolKind: 'standard',
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

const render = (props: ComponentProps<typeof PinnedProtocol>) => {
  return renderWithProviders(
    <MemoryRouter>
      <PinnedProtocol {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Pinned Protocol', () => {
  let props: ComponentProps<typeof PinnedProtocol>
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
    }
    vi.mocked(useFeatureFlag).mockReturnValue(false)
  })

  it('should display text - full', () => {
    render(props)
    const pinnedProtocolCard = screen.getByTestId('full_pinned_protocol_card')
    expect(pinnedProtocolCard).toHaveStyle('max-width: 59rem')
    expect(pinnedProtocolCard).toHaveStyle('height: 11.75rem')
    expect(pinnedProtocolCard).toHaveStyle(`background-color: ${COLORS.grey35}`)
    const text = screen.getByText('yay mock protocol')
    expect(text).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize32}`)
    expect(text).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight42}`)
    expect(text).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightBold}`)
  })

  it('should display text - half', () => {
    props = { ...props, cardSize: 'half' }
    render(props)
    const pinnedProtocolCard = screen.getByTestId('half_pinned_protocol_card')
    expect(pinnedProtocolCard).toHaveStyle('max-width: 29.25rem')
    expect(pinnedProtocolCard).toHaveStyle('height: 13.25rem')
    expect(pinnedProtocolCard).toHaveStyle(`background-color: ${COLORS.grey35}`)
    const text = screen.getByText('yay mock protocol')
    expect(text).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize28}`)
    expect(text).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight36}`)
    expect(text).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
  })

  it('should display text - regular', () => {
    props = { ...props, cardSize: 'regular' }
    render(props)
    const pinnedProtocolCard = screen.getByTestId(
      'regular_pinned_protocol_card'
    )
    expect(pinnedProtocolCard).toHaveStyle('max-width: 28.375rem')
    expect(pinnedProtocolCard).toHaveStyle('height: 13.25rem')
    expect(pinnedProtocolCard).toHaveStyle(`background-color: ${COLORS.grey35}`)
    const text = screen.getByText('yay mock protocol')
    expect(text).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize28}`)
    expect(text).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight36}`)
    expect(text).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
  })

  it('should redirect to protocol details after short click', () => {
    render(props)
    const name = screen.getByText('yay mock protocol')
    fireEvent.click(name)
    expect(mockNavigate).toHaveBeenCalledWith('/protocols/mockProtocol1')
  })

  it('should display modal after long click', async () => {
    mockLongPress.isLongPressed = true
    render(props)
    expect(props.longPress).toHaveBeenCalled()
    screen.getByText('Run protocol')
    // This should ne "Unpin protocol" but I don't know how to pass state into the render
    // call so the longpress modal can see the pinned ids.
    screen.getByText('Pin protocol')
    screen.getByText('Delete protocol')
  })

  it('should render yellow background and a chip when a protocol requires a csv file', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    props = { ...props, isRequiredCSV: true }
    render(props)
    const pinnedProtocolCard = screen.getByTestId('full_pinned_protocol_card')
    expect(pinnedProtocolCard).toHaveStyle(
      `background-color: ${COLORS.yellow35}`
    )
    screen.getByText('mock Chip')
  })
})
