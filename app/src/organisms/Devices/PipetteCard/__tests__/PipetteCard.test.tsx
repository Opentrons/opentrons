import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../__testing-utils__'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { usePipetteSettingsQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { PipetteCard } from '..'
import { useDropTipWizardFlows } from '../../../DropTipWizardFlows'

import {
  mockLeftSpecs,
  mockRightSpecs,
} from '../../../../redux/pipettes/__fixtures__'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

vi.mock('../PipetteOverflowMenu')
vi.mock('../../../../redux/config')
vi.mock('../../../../redux/robot-api')
vi.mock('@opentrons/react-api-client')
vi.mock('../../../../redux/pipettes')
vi.mock('../../../DropTipWizardFlows')

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let props: React.ComponentProps<typeof PipetteCard>

  beforeEach(() => {
    dispatchApiRequest = vi.fn()
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    vi.mocked(PipetteOverflowMenu).mockReturnValue(
      <div>mock pipette overflow menu</div>
    )
    vi.mocked(getHasCalibrationBlock).mockReturnValue(null)
    vi.mocked(useDispatchApiRequest).mockReturnValue([
      dispatchApiRequest,
      ['id'],
    ])
    vi.mocked(useDropTipWizardFlows).mockReturnValue({
      showDTWiz: false,
      toggleDTWiz: vi.fn(),
    })
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
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('left Mount')
    screen.getByText('Left Pipette')
  })

  it('renders information for a right pipette', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
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
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('left Mount')
    screen.getByText('Empty')
  })
  it('does not render banner to calibrate for ot2 pipette if not calibrated', () => {
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    expect(screen.queryByText('Calibrate now')).toBeNull()
  })
  it('renders kebab icon, opens and closes overflow menu on click', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
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
  it('does not render a pipette settings slideout card if the pipette has no settings', () => {
    render(props)
    expect(
      screen.queryByTestId(
        `PipetteSettingsSlideout_${mockRobotName}_${props.pipetteId}`
      )
    ).not.toBeInTheDocument()
  })
})
