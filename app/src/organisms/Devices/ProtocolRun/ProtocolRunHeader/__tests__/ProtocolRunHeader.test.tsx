import * as React from 'react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { ProtocolRunHeader } from '../../ProtocolRunHeader'
import { useRunStatus } from '../../../../RunTimeControl/hooks'
import {
  useIsRobotViewable,
  useProtocolDetailsForRun,
  useTrackProtocolRunEvent,
} from '../../../hooks'
import { useNotifyRunQuery } from '../../../../../resources/runs'
import {
  RunHeaderModalContainer,
  useConfirmCancelModal,
  useRunFailedModal,
  useProtocolAnalysisErrorsModal,
} from '../RunHeaderModalContainer'
import { RunHeaderBannerContainer } from '../RunHeaderBannerContainer'
import { RunHeaderContent } from '../RunHeaderContent'
import { RunProgressMeter } from '../../../../RunProgressMeter'
import { RunHeaderProtocolName } from '../RunHeaderProtocolName'

vi.mock('react-router-dom')
vi.mock('../../../../RunTimeControl/hooks')
vi.mock('../../../hooks')
vi.mock('../../../../../resources/runs')
vi.mock('../RunHeaderModalContainer')
vi.mock('../RunHeaderBannerContainer')
vi.mock('../RunHeaderContent')
vi.mock('../../../../RunProgressMeter')
vi.mock('../RunHeaderProtocolName')

describe('ProtocolRunHeader', () => {
  let props: React.ComponentProps<typeof ProtocolRunHeader>
  const mockNavigate = vi.fn()

  beforeEach(() => {
    props = {
      protocolRunHeaderRef: null,
      robotName: 'MOCK ROBOT',
      runId: 'MOCK ID',
      makeHandleJumpToStep: vi.fn(),
      missingSetupSteps: [],
    }

    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useProtocolDetailsForRun).mockReturnValue({
      protocolData: {} as any,
      displayName: 'MOCK PROTOCOL',
    } as any)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { hasEverEnteredErrorRecovery: false } },
    } as any)

    vi.mocked(RunHeaderModalContainer).mockReturnValue(
      <div>MOCK_RUN_HEADER_MODAL_CONTAINER</div>
    )
    vi.mocked(RunHeaderBannerContainer).mockReturnValue(
      <div>MOCK_RUN_HEADER_BANNER_CONTAINER</div>
    )
    vi.mocked(RunHeaderContent).mockReturnValue(
      <div>MOCK_RUN_HEADER_CONTENT</div>
    )
    vi.mocked(RunProgressMeter).mockReturnValue(
      <div>MOCK_RUN_PROGRESS_METER</div>
    )
    vi.mocked(RunHeaderProtocolName).mockReturnValue(
      <div>MOCK_RUN_HEADER_PROTOCOL_NAME</div>
    )

    vi.mocked(useConfirmCancelModal).mockReturnValue({
      showModal: false,
      toggleModal: vi.fn(),
    })
    vi.mocked(useRunFailedModal).mockReturnValue({
      showRunFailedModal: false,
      toggleModal: vi.fn(),
    })
    vi.mocked(useProtocolAnalysisErrorsModal).mockReturnValue({} as any)
    vi.mocked(useTrackProtocolRunEvent).mockReturnValue({
      trackProtocolRunEvent: vi.fn(),
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const render = (props: React.ComponentProps<typeof ProtocolRunHeader>) => {
    return renderWithProviders(<ProtocolRunHeader {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it('renders all components', () => {
    render(props)

    screen.getByText('MOCK_RUN_HEADER_MODAL_CONTAINER')
    screen.getByText('MOCK_RUN_HEADER_PROTOCOL_NAME')
    screen.getByText('MOCK_RUN_HEADER_BANNER_CONTAINER')
    screen.getByText('MOCK_RUN_HEADER_CONTENT')
    screen.getByText('MOCK_RUN_PROGRESS_METER')
  })

  it('navigates to /devices if robot is not viewable', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(false)

    render(props)

    expect(mockNavigate).toHaveBeenCalledWith('/devices')
  })

  it('does not navigate if protocolData is null', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(false)
    vi.mocked(useProtocolDetailsForRun).mockReturnValue({
      protocolData: null,
      displayName: 'MOCK PROTOCOL',
    } as any)

    render(props)

    expect(mockNavigate).not.toHaveBeenCalledWith('/devices')
  })
})
