import { useDispatch } from 'react-redux'
import { act, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  MockLPCContentContainer,
  mockLPCContentProps,
} from '/app/organisms/LabwarePositionCheck/__fixtures__'
import {
  useLPCSnackbars,
  useLPCToasts,
} from '/app/organisms/LabwarePositionCheck/hooks'
import { LPCLabwareDetails } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/LPCLabwareDetails'
import { getIsOnDevice } from '/app/redux/config'
import {
  applyWorkingOffsets,
  goBackEditOffsetSubstep,
  selectIsAnyOffsetHardCoded,
  selectIsDefaultOffsetAbsent,
  selectSelectedLwDisplayName,
  selectSelectedLwOverview,
  selectSnackbarStatus,
  selectStepInfo,
  selectWorkingOffsetsByUri,
} from '/app/redux/protocol-runs'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'
import type { InlineNotification } from '@opentrons/components'

vi.mock(
  '/app/organisms/LabwarePositionCheck/steps/HandleLabware/LPCLabwareDetails/DefaultLocationOffset',
  () => ({
    DefaultLocationOffset: () => <div>MOCK_DEFAULT_LOCATION_OFFSET</div>,
  })
)
vi.mock(
  '/app/organisms/LabwarePositionCheck/steps/HandleLabware/LPCLabwareDetails/LocationSpecificOffsetsContainer',
  () => ({
    LocationSpecificOffsetsContainer: () => (
      <div>MOCK_LOCATION_SPECIFIC_OFFSETS_CONTAINER</div>
    ),
  })
)
vi.mock('../OffsetBannerContainer', () => ({
  OffsetBannerContainer: () => <div>MOCK_OFFSET_BANNER_CONTAINER</div>,
}))
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InlineNotification>()
  return {
    ...actual,
    InlineNotification: vi.fn(({ type, heading, message }) => (
      <div
        data-testid="inline-notification"
        data-type={type}
        data-heading={heading}
      >
        {message}
      </div>
    )),
  }
})

vi.mock(
  '/app/organisms/LabwarePositionCheck/steps/HandleLabware/UnsavedOffsets',
  () => ({
    handleUnsavedOffsetsModalODD: vi.fn(),
    UnsavedOffsetsDesktop: vi.fn(({ toggleShowUnsavedOffsetsDesktop }) => (
      <div data-testid="unsaved-offsets-desktop">
        Mock Unsaved Offsets Desktop
        <button onClick={toggleShowUnsavedOffsetsDesktop}>Cancel</button>
      </div>
    )),
  })
)
vi.mock('/app/organisms/LabwarePositionCheck/LPCContentContainer', () => ({
  LPCContentContainer: MockLPCContentContainer,
}))
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: vi.fn(),
  }
})
vi.mock('/app/redux/protocol-runs', () => ({
  selectSelectedLwOverview: vi.fn(),
  selectSelectedLwDisplayName: vi.fn(),
  selectWorkingOffsetsByUri: vi.fn(),
  selectIsDefaultOffsetAbsent: vi.fn(),
  selectCountNonHardcodedLocationSpecificOffsetsForLw: vi.fn(),
  selectIsAnyOffsetHardCoded: vi.fn(),
  selectStepInfo: vi.fn(),
  goBackEditOffsetSubstep: vi.fn(),
  applyWorkingOffsets: vi.fn(),
  selectSnackbarStatus: vi.fn(),
}))
vi.mock('/app/redux/config', () => ({
  getIsOnDevice: vi.fn(),
}))
vi.mock('/app/organisms/LabwarePositionCheck/hooks')

const render = (props: ComponentProps<typeof LPCLabwareDetails>) => {
  const mockState = {
    [props.runId]: {
      steps: {
        currentStepIndex: 2,
        totalStepCount: 5,
        protocolName: 'MOCK_PROTOCOL',
      },
    },
  }

  return renderWithProviders(<LPCLabwareDetails {...props} />, {
    i18nInstance: i18n,
    initialState: mockState,
  })[0]
}

describe('LPCLabwareDetails', () => {
  let props: ComponentProps<typeof LPCLabwareDetails>
  let mockDispatch: Mock
  let mockSaveWorkingOffsets: Mock
  let mockMakeSnackbar: Mock
  let mockMakeSuccessToast: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    mockMakeSnackbar = vi.fn()
    mockMakeSuccessToast = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    mockSaveWorkingOffsets = vi.fn(() => Promise.resolve('mock-data'))

    props = {
      ...mockLPCContentProps,
      commandUtils: {
        saveWorkingOffsets: mockSaveWorkingOffsets,
        isSavingWorkingOffsetsLoading: false,
      } as any,
    }

    vi.mocked(getIsOnDevice).mockReturnValue(false)

    vi.mocked(
      selectStepInfo
    ).mockImplementation((runId: string) => (state: any) => state[runId]?.steps)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () => ({
      uri: 'labware-uri-1',
      id: 'labware-1',
      offsetLocationDetails: null,
    }))
    vi.mocked(selectSelectedLwDisplayName).mockImplementation(() => () =>
      'Test Labware'
    )
    vi.mocked(selectWorkingOffsetsByUri).mockImplementation(() => () =>
      ({
        test: {},
      } as any)
    )
    vi.mocked(selectIsDefaultOffsetAbsent).mockImplementation(() => () => false)
    vi.mocked(selectIsAnyOffsetHardCoded).mockImplementation(() => () => false)
    vi.mocked(goBackEditOffsetSubstep).mockReturnValue({
      type: 'GO_BACK_HANDLE_LW_SUBSTEP',
    } as any)
    vi.mocked(applyWorkingOffsets).mockReturnValue({
      type: 'APPLY_WORKING_OFFSETS',
    } as any)
    vi.mocked(selectSnackbarStatus).mockImplementation(() => () => null)
    vi.mocked(useLPCSnackbars).mockReturnValue({
      makeSuccessSnackbar: mockMakeSnackbar,
    } as any)
    vi.mocked(useLPCToasts).mockReturnValue({
      makeSuccessToast: mockMakeSuccessToast,
    })
  })

  it('passes correct header props to LPCContentContainer', () => {
    render(props)

    const header = screen.getByTestId('header-prop')
    expect(header).toHaveTextContent('Test Labware')

    const primaryButton = screen.getByTestId('primary-button')
    expect(primaryButton).toHaveAttribute('data-button-text', 'Save')
    expect(primaryButton).toHaveAttribute('data-click-handler', 'true')
  })

  it('renders the mocked child components', () => {
    render(props)

    screen.getByText('MOCK_DEFAULT_LOCATION_OFFSET')
    screen.getByText('MOCK_LOCATION_SPECIFIC_OFFSETS_CONTAINER')
    screen.getByText('MOCK_OFFSET_BANNER_CONTAINER')
  })

  it('dispatches actions when save is clicked with working offsets', async () => {
    render(props)

    const primaryButton = screen.getByTestId('primary-button')
    primaryButton.click()

    await act(async () => {
      await expect(mockSaveWorkingOffsets).toHaveBeenCalled()
    })

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    expect(applyWorkingOffsets).toHaveBeenCalledWith(props.runId, 'mock-data')
    expect(goBackEditOffsetSubstep).toHaveBeenCalledWith(props.runId)
    expect(mockMakeSuccessToast).not.toHaveBeenCalled()
  })

  it('make a success toast if on an odd on save click', async () => {
    vi.mocked(getIsOnDevice).mockReturnValue(true)

    render(props)

    const primaryButton = screen.getByTestId('primary-button')
    primaryButton.click()

    await act(async () => {
      await expect(mockSaveWorkingOffsets).toHaveBeenCalled()
    })

    expect(mockMakeSuccessToast).toHaveBeenCalled()
  })

  it('calls make success snackbar if the snackbar status is not null', () => {
    vi.mocked(selectSnackbarStatus).mockImplementation(() => () =>
      'locationSpecificAdjusted'
    )

    render(props)

    expect(mockMakeSnackbar).toHaveBeenCalled()
  })
})
