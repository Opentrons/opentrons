import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import {
  renderWithProviders,
  useConditionalConfirm,
} from '@opentrons/components'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { i18n } from '../../../../../i18n'
import { useRunStatus } from '../../../../RunTimeControl/hooks'
import { TipLengthCalibration } from '../TipLengthCalibration'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('@opentrons/components/src/hooks')
jest.mock('../../../../../redux/config/selectors')
jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../RunTimeControl/hooks')

const mockUseConditionalConfirm = useConditionalConfirm as jest.MockedFunction<
  typeof useConditionalConfirm
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>

const mockConfirm = jest.fn()
const mockCancel = jest.fn()

describe('TipLengthCalibration', () => {
  const render = ({
    mount = 'left',
    disabled = false,
    robotName = 'robot name',
    hasCalibrated = false,
    tipRackDefinition = fixture_tiprack_300_ul as LabwareDefinition2,
    isExtendedPipOffset = false,
  }: Partial<React.ComponentProps<typeof TipLengthCalibration>> = {}) => {
    return renderWithProviders(
      <TipLengthCalibration
        {...{
          mount,
          disabled,
          robotName,
          hasCalibrated,
          tipRackDefinition,
          isExtendedPipOffset,
        }}
      />,
      { i18nInstance: i18n }
    )[0]
  }

  beforeEach(() => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_IDLE)
    mockUseConditionalConfirm.mockReturnValue({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the calibrate now button if tip length not calibrated', () => {
    const { getByRole } = render()
    expect(getByRole('button', { name: 'Calibrate Now' })).toBeTruthy()
  })

  it('renders the recalibrate link if tip length calibrated and run unstarted', () => {
    const { getByText } = render({ hasCalibrated: true })
    const recalibrate = getByText('Recalibrate')
    fireEvent.click(recalibrate)
    expect(mockConfirm).toBeCalled()
  })

  it('disables the recalibrate link if tip length calibrated and run started', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    const { getByText } = render({ hasCalibrated: true })
    const recalibrate = getByText('Recalibrate')
    fireEvent.click(recalibrate)
    expect(mockConfirm).not.toBeCalled()
  })
})
