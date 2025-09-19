import { useDispatch } from 'react-redux'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InlineNotification } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockLPCContentProps } from '/app/organisms/LabwarePositionCheck/__fixtures__'
import {
  selectIsAnyOffsetHardCoded,
  selectIsDefaultOffsetAbsent,
  selectSelectedLwOverview,
  selectShowDefaultOffsetInfoBanner,
  toggleDefaultOffsetInfoBanner,
} from '/app/redux/protocol-runs'

import { OffsetBannerContainer } from '../OffsetBannerContainer'

import type { ComponentProps } from 'react'

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: vi.fn(),
    useSelector: vi.fn(selector => {
      return selector()
    }),
  }
})

vi.mock('/app/atoms/InlineNotification')
vi.mock('/app/redux/protocol-runs', () => ({
  selectIsAnyOffsetHardCoded: vi.fn(),
  selectIsDefaultOffsetAbsent: vi.fn(),
  selectSelectedLwOverview: vi.fn(),
  selectShowDefaultOffsetInfoBanner: vi.fn(),
  toggleDefaultOffsetInfoBanner: vi.fn(),
}))
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InlineNotification>()
  return {
    ...actual,
    InlineNotification: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof OffsetBannerContainer>) => {
  const mockState = {
    [props.runId]: {
      steps: {
        currentStepIndex: 2,
        totalStepCount: 5,
        protocolName: 'MOCK_PROTOCOL',
      },
    },
  }

  return renderWithProviders(<OffsetBannerContainer {...props} />, {
    i18nInstance: i18n,
    initialState: mockState,
  })[0]
}

describe('OffsetBannerContainer', () => {
  let props: ComponentProps<typeof OffsetBannerContainer>
  let mockDispatch: any

  beforeEach(() => {
    mockDispatch = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)

    props = {
      ...mockLPCContentProps,
    }

    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
    vi.mocked(toggleDefaultOffsetInfoBanner).mockReturnValue({
      type: 'TOGGLE_DEFAULT_OFFSET_INFO_BANNER',
    } as any)

    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      ({
        uri: 'test-uri-1',
        displayName: 'Test Labware',
      } as any)
    )
    vi.mocked(selectIsDefaultOffsetAbsent).mockImplementation(() => () => false)
    vi.mocked(selectIsAnyOffsetHardCoded).mockImplementation(() => () => false)
    vi.mocked(selectShowDefaultOffsetInfoBanner).mockImplementation(() => () =>
      false
    )
  })

  it('renders no banner when no conditions are met', () => {
    render(props)
    expect(
      screen.queryByText('MOCK_INLINE_NOTIFICATION')
    ).not.toBeInTheDocument()
  })

  it('renders default alert banner when default offset is absent', () => {
    vi.mocked(selectIsDefaultOffsetAbsent).mockImplementation(() => () => true)

    render(props)

    expect(screen.getByText('MOCK_INLINE_NOTIFICATION')).toBeInTheDocument()
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Add a default offset to automatically apply it to all placements of this labware on the deck',
        message: 'Specific slot locations can be adjusted as needed',
      }),
      {}
    )
  })

  it('renders default info banner when showDefaultInfoBanner is true', () => {
    vi.mocked(selectShowDefaultOffsetInfoBanner).mockImplementation(() => () =>
      true
    )

    render(props)

    expect(screen.getByText('MOCK_INLINE_NOTIFICATION')).toBeInTheDocument()
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'neutral',
        heading:
          'The default offset is used for all placements of the labware unless you adjust the applied location offset.',
        onCloseClick: expect.any(Function),
      }),
      {}
    )
  })

  it('renders hardcoded info banner when any offset is hardcoded', () => {
    vi.mocked(selectIsAnyOffsetHardCoded).mockImplementation(() => () => true)

    render(props)

    expect(screen.getByText('MOCK_INLINE_NOTIFICATION')).toBeInTheDocument()
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'neutral',
        heading:
          'Changing the default offset will not automatically update hardcoded offsets',
        message: 'Hardcoded offsets must be changed in your Python protocol',
      }),
      {}
    )
  })

  it('prioritizes default alert over default info banner', () => {
    vi.mocked(selectIsDefaultOffsetAbsent).mockImplementation(() => () => true)
    vi.mocked(selectShowDefaultOffsetInfoBanner).mockImplementation(() => () =>
      true
    )

    render(props)

    expect(screen.getByText('MOCK_INLINE_NOTIFICATION')).toBeInTheDocument()
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Add a default offset to automatically apply it to all placements of this labware on the deck',
      }),
      {}
    )
  })

  it('prioritizes default info banner over hardcoded info banner', () => {
    vi.mocked(selectShowDefaultOffsetInfoBanner).mockImplementation(() => () =>
      true
    )
    vi.mocked(selectIsAnyOffsetHardCoded).mockImplementation(() => () => true)

    render(props)

    expect(screen.getByText('MOCK_INLINE_NOTIFICATION')).toBeInTheDocument()
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'neutral',
        heading:
          'The default offset is used for all placements of the labware unless you adjust the applied location offset.',
      }),
      {}
    )
  })

  it('passes the correct URI to selectors', () => {
    const mockUri = 'test-uri-123'
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      ({
        uri: mockUri,
        displayName: 'Test Labware',
      } as any)
    )

    render(props)

    expect(selectIsDefaultOffsetAbsent).toHaveBeenCalledWith(
      props.runId,
      mockUri
    )
    expect(selectIsAnyOffsetHardCoded).toHaveBeenCalledWith(
      props.runId,
      mockUri
    )
  })
})
