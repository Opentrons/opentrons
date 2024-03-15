import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../__testing-utils__'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import {
  useCurrentSubsystemUpdateQuery,
  usePipetteSettingsQuery,
} from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { AskForCalibrationBlockModal } from '../../../CalibrateTipLength'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { useDeckCalibrationData, useIsFlex } from '../../hooks'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { PipetteCard } from '..'

import {
  mockLeftSpecs,
  mockRightSpecs,
} from '../../../../redux/pipettes/__fixtures__'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

vi.mock('../PipetteOverflowMenu')
vi.mock('../../../../redux/config')
vi.mock('../../../CalibratePipetteOffset/useCalibratePipetteOffset')
vi.mock('../../../CalibrateTipLength')
vi.mock('../../hooks')
vi.mock('../AboutPipetteSlideout')
vi.mock('../../../../redux/robot-api')
vi.mock('@opentrons/react-api-client')
vi.mock('../../../../redux/pipettes')

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  let startWizard: any
  let dispatchApiRequest: DispatchApiRequestType
  let props: React.ComponentProps<typeof PipetteCard>

  beforeEach(() => {
    startWizard = vi.fn()
    dispatchApiRequest = vi.fn()
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    when(useIsFlex).calledWith(mockRobotName).thenReturn(false)
    vi.mocked(AboutPipetteSlideout).mockReturnValue(
      <div>mock about slideout</div>
    )
    when(useDeckCalibrationData).calledWith(mockRobotName).thenReturn({
      isDeckCalibrated: true,
      deckCalibrationData: mockDeckCalData,
    })
    vi.mocked(PipetteOverflowMenu).mockReturnValue(
      <div>mock pipette overflow menu</div>
    )
    vi.mocked(getHasCalibrationBlock).mockReturnValue(null)
    vi.mocked(useCalibratePipetteOffset).mockReturnValue([startWizard, null])
    vi.mocked(AskForCalibrationBlockModal).mockReturnValue(
      <div>Mock AskForCalibrationBlockModal</div>
    )
    vi.mocked(useDispatchApiRequest).mockReturnValue([
      dispatchApiRequest,
      ['id'],
    ])
    vi.mocked(useCurrentSubsystemUpdateQuery).mockReturnValue({
      data: undefined,
    } as any)
    when(usePipetteSettingsQuery)
      .calledWith({ refetchInterval: 5000, enabled: true })
      .thenReturn({} as any)
  })

  it('renders information for a left pipette', () => {
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('left Mount')
    screen.getByText('Left Pipette')
  })
  it('renders information for a 96 channel pipette with overflow menu button not disabled', () => {
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: true,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('Both Mounts')
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    screen.getByText('mock pipette overflow menu')
  })

  it('renders information for a 96 channel pipette with overflow menu button disabled when e-stop is pressed', () => {
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: true,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: true,
    }
    render(props)
    screen.getByText('Both Mounts')
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    expect(overflowButton).toBeDisabled()
  })

  it('renders information for a right pipette', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('right Mount')
    screen.getByText('Right Pipette')
  })
  it('renders information for no pipette on right Mount', () => {
    props = {
      pipetteModelSpecs: null,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('right Mount')
    screen.getByText('Empty')
  })
  it('renders information for no pipette on left Mount', () => {
    props = {
      pipetteModelSpecs: null,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('left Mount')
    screen.getByText('Empty')
  })
  it('does not render banner to calibrate for ot2 pipette if not calibrated', () => {
    when(useIsFlex).calledWith(mockRobotName).thenReturn(false)
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    expect(screen.queryByText('Calibrate now')).toBeNull()
  })
  it('renders banner to calibrate for ot3 pipette if not calibrated', () => {
    when(useIsFlex).calledWith(mockRobotName).thenReturn(true)
    props = {
      pipetteModelSpecs: { ...mockLeftSpecs, name: 'p300_single_flex' },
      mount: LEFT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('Calibrate now')
  })
  it('renders kebab icon, opens and closes overflow menu on click', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)

    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })

    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    const overflowMenu = screen.getByText('mock pipette overflow menu')
    fireEvent.click(overflowMenu)
    expect(screen.queryByText('mock pipette overflow menu')).toBeNull()
  })
  it('renders firmware update needed state if pipette is bad', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: true,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('Right mount')
    screen.getByText('Instrument attached')
    screen.getByText(
      `Instrument firmware update needed. Start the update on the robot's touchscreen.`
    )
  })
  it('renders firmware update in progress state if pipette is bad and update in progress', () => {
    vi.mocked(useCurrentSubsystemUpdateQuery).mockReturnValue({
      data: { data: { updateProgress: 50 } as any },
    } as any)
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: true,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('Right mount')
    screen.getByText('Instrument attached')
    screen.getByText('Firmware update in progress...')
  })
  it('does not render a pipette settings slideout card if the pipette has no settings', () => {
    render(props)
    expect(
      screen.queryByTestId(
        `PipetteSettingsSlideout_${mockRobotName}_${props.pipetteId}`
      )
    ).not.toBeInTheDocument()
  })
})
