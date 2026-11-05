import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex } from '/app/redux-resources/robots'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'

import { PipetteOffsetCalibrationItems } from '../CalibrationDetails/PipetteOffsetCalibrationItems'
import { RobotSettingsPipetteOffsetCalibration } from '../RobotSettingsPipetteOffsetCalibration'

import type { ComponentProps } from 'react'
import type { FormattedPipetteOffsetCalibration } from '..'

vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('/app/resources/instruments')
vi.mock('/app/redux-resources/robots')
vi.mock('../CalibrationDetails/PipetteOffsetCalibrationItems')

const mockFormattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] =
  []

const render = (
  props?: Partial<ComponentProps<typeof RobotSettingsPipetteOffsetCalibration>>
) => {
  return renderWithProviders(
    <RobotSettingsPipetteOffsetCalibration
      formattedPipetteOffsetCalibrations={
        mockFormattedPipetteOffsetCalibrations
      }
      robotName="otie"
      isRobotBusy={false}
      {...props}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsPipetteOffsetCalibration', () => {
  beforeEach(() => {
    vi.when(useIsFlex).calledWith('otie').thenReturn(false)
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: null,
      right: null,
    })
    vi.mocked(PipetteOffsetCalibrationItems).mockReturnValue(
      <div>PipetteOffsetCalibrationItems</div>
    )
  })

  it('renders a title and description - Pipette Calibrations', () => {
    vi.when(useIsFlex).calledWith('otie').thenReturn(true)
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    render()
    screen.getByText('Pipette Calibrations')
    screen.getByText(
      `Pipette calibration uses a metal probe to determine the pipette's exact position relative to precision-cut squares on deck slots.`
    )
    screen.getByText('PipetteOffsetCalibrationItems')
  })
})
