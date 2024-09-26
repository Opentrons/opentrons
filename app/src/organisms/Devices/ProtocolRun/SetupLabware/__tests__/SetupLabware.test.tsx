import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useLPCSuccessToast } from '../../../hooks/useLPCSuccessToast'
import { LabwarePositionCheck } from '/app/organisms/LabwarePositionCheck'
import { getModuleTypesThatRequireExtraAttention } from '../../utils/getModuleTypesThatRequireExtraAttention'
import { getIsLabwareOffsetCodeSnippetsOn } from '/app/redux/config'
import { SetupLabwareList } from '../SetupLabwareList'
import { SetupLabwareMap } from '../SetupLabwareMap'
import { SetupLabware } from '..'
import {
  useNotifyRunQuery,
  useRunCalibrationStatus,
  useRunHasStarted,
  useLPCDisabledReason,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'

vi.mock('../SetupLabwareList')
vi.mock('../SetupLabwareMap')
vi.mock('/app/organisms/LabwarePositionCheck')
vi.mock('../../utils/getModuleTypesThatRequireExtraAttention')
vi.mock('/app/organisms/RunTimeControl/hooks')
vi.mock('/app/redux/config')
vi.mock('../../../hooks/useLPCSuccessToast')
vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/robots')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

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

    vi.mocked(LabwarePositionCheck).mockReturnValue(
      <div>mock Labware Position Check</div>
    )
    when(vi.mocked(useUnmatchedModulesForProtocol))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })

    when(vi.mocked(useLPCSuccessToast))
      .calledWith()
      .thenReturn({ setIsShowingLPCSuccessToast: vi.fn() })

    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({
        complete: true,
      })
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(false)
    vi.mocked(getIsLabwareOffsetCodeSnippetsOn).mockReturnValue(false)
    vi.mocked(SetupLabwareMap).mockReturnValue(
      <div>mock setup labware map</div>
    )
    vi.mocked(SetupLabwareList).mockReturnValue(
      <div> mock setup labware list</div>
    )
    vi.mocked(useLPCDisabledReason).mockReturnValue(null)
    vi.mocked(useNotifyRunQuery).mockReturnValue({} as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render the list view, clicking the toggle button will turn to map view', () => {
    render()
    screen.getByText('mock setup labware list')
    screen.getByRole('button', { name: 'List View' })
    const mapView = screen.getByRole('button', { name: 'Map View' })
    fireEvent.click(mapView)
    screen.getByText('mock setup labware map')
  })
})
