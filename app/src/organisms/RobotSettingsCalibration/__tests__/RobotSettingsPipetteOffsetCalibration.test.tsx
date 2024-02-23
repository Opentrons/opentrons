import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
import {
  useIsFlex,
  usePipetteOffsetCalibrations,
  useAttachedPipettesFromInstrumentsQuery,
} from '../../../organisms/Devices/hooks'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'

import { RobotSettingsPipetteOffsetCalibration } from '../RobotSettingsPipetteOffsetCalibration'
import { PipetteOffsetCalibrationItems } from '../CalibrationDetails/PipetteOffsetCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '..'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../CalibrationDetails/PipetteOffsetCalibrationItems')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUsePipetteOffsetCalibrations = usePipetteOffsetCalibrations as jest.MockedFunction<
  typeof usePipetteOffsetCalibrations
>
const mockPipetteOffsetCalibrationItems = PipetteOffsetCalibrationItems as jest.MockedFunction<
  typeof PipetteOffsetCalibrationItems
>
const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
>
const mockFormattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] = []
const mockUpdateRobotStatus = jest.fn()

const render = (
  props?: Partial<
    React.ComponentProps<typeof RobotSettingsPipetteOffsetCalibration>
  >
) => {
  return renderWithProviders(
    <RobotSettingsPipetteOffsetCalibration
      formattedPipetteOffsetCalibrations={
        mockFormattedPipetteOffsetCalibrations
      }
      robotName="otie"
      updateRobotStatus={mockUpdateRobotStatus}
      {...props}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsPipetteOffsetCalibration', () => {
  beforeEach(() => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(false)
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
    mockPipetteOffsetCalibrationItems.mockReturnValue(
      <div>PipetteOffsetCalibrationItems</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders a title - Pipette Offset Calibrations', () => {
    const [{ getByText }] = render()
    getByText('Pipette Offset Calibrations')
    getByText('PipetteOffsetCalibrationItems')
  })

  it('renders a Flex title and description - Pipette Calibrations', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    const [{ getByText }] = render()
    getByText('Pipette Calibrations')
    getByText(
      `Pipette calibration uses a metal probe to determine the pipette's exact position relative to precision-cut squares on deck slots.`
    )
    getByText('PipetteOffsetCalibrationItems')
  })

  it('renders Not calibrated yet when no pipette offset calibrations data', () => {
    mockUsePipetteOffsetCalibrations.mockReturnValue(null)
    const [{ getByText }] = render()
    getByText('No pipette attached')
  })
})
