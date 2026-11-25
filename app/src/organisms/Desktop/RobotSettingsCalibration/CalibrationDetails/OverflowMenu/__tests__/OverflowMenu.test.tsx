import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isFlexPipette, OT3_PIPETTES } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { PipetteWizardFlows } from '/app/organisms/PipetteWizardFlows'
import { useIsEstopNotDisengaged } from '/app/resources/devices'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'
import { useRunStatuses } from '/app/resources/runs'

import { OverflowMenu } from '..'

import type { ComponentProps } from 'react'
import type { Mount } from '@opentrons/components'

const render = (
  props: ComponentProps<typeof OverflowMenu>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const ROBOT_NAME = 'otie'
const CAL_TYPE = 'pipetteOffset'
const PIPETTE_NAME = 'pipetteName'
const OT3_PIPETTE_NAME = OT3_PIPETTES[0]

vi.mock('/app/local-resources/files/fileSaveCanceledError', () => ({
  isFileSaveCanceledError: vi.fn(),
}))
vi.mock('/app/redux/shell/remote', () => ({
  saveFileFromBuffer: vi.fn().mockResolvedValue('/tmp'),
}))

vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    isFlexPipette: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-api/selectors')
vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('/app/organisms/PipetteWizardFlows')
vi.mock('/app/resources/devices')
vi.mock('/app/resources/instruments')
vi.mock('/app/resources/runs')

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

describe('OverflowMenu', () => {
  let props: ComponentProps<typeof OverflowMenu>

  beforeEach(() => {
    props = {
      calType: CAL_TYPE,
      robotName: ROBOT_NAME,
      mount: 'left' as Mount,
      serialNumber: 'serialNumber',
      pipetteName: PIPETTE_NAME,
      isRobotBusy: false,
      tiprackDefURI: 'mock/tiprack/uri',
    }
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: null,
      right: null,
    })

    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
    vi.mocked(isFlexPipette).mockReturnValue(false)
  })

  it('should close the overflow menu when clicking it again', () => {
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    fireEvent.click(button)
    expect(screen.queryByText('Recalibrate pipette')).not.toBeInTheDocument()
  })

  it('recalibration button should open up the pipette wizard flow for flex pipettes', () => {
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    vi.mocked(PipetteWizardFlows).mockReturnValue(
      <div>mock pipette wizard flows</div>
    )
    props = {
      ...props,
      pipetteName: OT3_PIPETTE_NAME,
    }
    vi.mocked(isFlexPipette).mockReturnValue(true)
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const cal = screen.getByText('Recalibrate pipette')
    fireEvent.click(cal)
    screen.getByText('mock pipette wizard flows')
  })

  it('calibration button should open up the pipette wizard flow for flex pipettes', () => {
    vi.mocked(PipetteWizardFlows).mockReturnValue(
      <div>mock pipette wizard flows</div>
    )
    props = {
      ...props,
      pipetteName: OT3_PIPETTE_NAME,
    }
    vi.mocked(isFlexPipette).mockReturnValue(true)
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const cal = screen.getByText('Calibrate pipette')
    fireEvent.click(cal)
    screen.getByText('mock pipette wizard flows')
  })

  it('should make overflow menu disabled when e-stop is pressed', () => {
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(true)
    render(props)
    expect(
      screen.getByLabelText('CalibrationOverflowMenu_button_pipetteOffset')
    ).toBeDisabled()
  })

  it('should disable the calibration overflow menu option when the run is running', () => {
    vi.mocked(isFlexPipette).mockReturnValue(true)

    render({ ...props, isRobotBusy: true })

    fireEvent.click(
      screen.getByLabelText('CalibrationOverflowMenu_button_pipetteOffset')
    )

    expect(
      screen.getByLabelText('CalibrationOverflowMenu_button_calibrate')
    ).toBeDisabled()
  })
})
