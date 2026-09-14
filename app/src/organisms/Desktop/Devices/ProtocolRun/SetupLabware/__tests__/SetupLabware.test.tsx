import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useHoverTooltip } from '@opentrons/components'
import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  createReasonNotRequiredDocumentationState,
} from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { getIsLabwareOffsetCodeSnippetsOn } from '/app/redux/config'
import {
  useLPCDisabledReason,
  useNotifyRunQuery,
  useRunCalibrationStatus,
  useRunHasStarted,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'

import { SetupLabware } from '..'
import { getModuleTypesThatRequireExtraAttention } from '../../utils/getModuleTypesThatRequireExtraAttention'
import { SetupLabwareList } from '../SetupLabwareList'
import { SetupLabwareMap } from '../SetupLabwareMap'

import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    useHoverTooltip: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    usePostLogMessageMutation: vi.fn(),
  }
})
vi.mock('../SetupLabwareList')
vi.mock('../SetupLabwareMap')
vi.mock('/app/organisms/LegacyLabwarePositionCheck')
vi.mock('../../utils/getModuleTypesThatRequireExtraAttention')
vi.mock('/app/organisms/RunTimeControl/hooks')
vi.mock('/app/redux/config')
vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/local-resources/access-control/useDocumentationState')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const mockPostLogMessage = vi.fn()

const render = () => {
  let labwareConfirmed = false
  const confirmLabware = vi.fn(confirmed => {
    labwareConfirmed = confirmed
  })
  return renderWithProviders(
    <MemoryRouter>
      <SetupLabware
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        labwareConfirmed={labwareConfirmed}
        setLabwareConfirmed={confirmLabware}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupLabware', () => {
  beforeEach(() => {
    when(vi.mocked(getModuleTypesThatRequireExtraAttention))
      .calledWith(expect.anything())
      .thenReturn([])

    when(vi.mocked(useUnmatchedModulesForProtocol))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        complete: true,
      })
    vi.mocked(getIsLabwareOffsetCodeSnippetsOn).mockReturnValue(false)
    vi.mocked(SetupLabwareMap).mockReturnValue(
      <div>mock setup labware map</div>
    )
    vi.mocked(SetupLabwareList).mockReturnValue(
      <div> mock setup labware list</div>
    )
    vi.mocked(useLPCDisabledReason).mockReturnValue(null)
    vi.mocked(useNotifyRunQuery).mockReturnValue({} as any)
    vi.mocked(useHoverTooltip).mockReturnValue([{}, {}] as any)
    vi.mocked(useRunHasStarted).mockReturnValue(false)
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render the map view, clicking the toggle button will turn to list view', () => {
    render()
    screen.getByText('mock setup labware map')
    screen.getByRole('button', { name: 'Map View' })
    screen.getByRole('button', { name: 'Confirm placements' })
    const listView = screen.getByRole('button', { name: 'List View' })
    fireEvent.click(listView)
    screen.getByText('mock setup labware list')
  })

  it('disables the confirmation button if the run has already started', () => {
    vi.mocked(useRunHasStarted).mockReturnValue(true)

    render()

    const btn = screen.getByRole('button', {
      name: 'Confirm placements',
    })

    expect(btn).toBeDisabled()
  })

  it('sends a message to the audit log when CRS is on and placements are confirmed', () => {
    vi.mocked(useDocumentationState).mockReturnValue(
      createReasonNotRequiredDocumentationState()
    )
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm placements' }))
    expect(mockPostLogMessage).toHaveBeenCalledWith(
      {
        action: 'confirm liquid and labware placements',
        message:
          'user confirmed liquid and labware placements before running protocol',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    )
  })
})
