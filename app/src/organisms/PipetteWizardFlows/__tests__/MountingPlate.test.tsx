import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { MountingPlate } from '../MountingPlate'

import type { AttachedPipette } from '../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof MountingPlate>) => {
  return renderWithProviders(<MountingPlate {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('MountingPlate', () => {
  let props: React.ComponentProps<typeof MountingPlate>
  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
  })
  it('returns the correct information, buttons work as expected for attach flow', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Connect and Attach Mounting Plate')
    getByText(
      'Hold onto the pipette so it does not fall. Attach the monting plate to the robot by alinging the pins on the mounting plate to the slots on the z axis carriage.'
    )
    getByText(
      'You may need to adjust the z axis to align the left and right channels for propper fitment.'
    )
    getByAltText('Attach mounting plate')
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })

  it('returns the correct information, buttons work as expected for detach flow', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Unscrew and Dettach Mounting Plate')
    getByText(
      'Hold onto the pipette so it does not fall. Dettach the monting plate to the robot by removing the pins on the plate from the slots on the gantry carriage'
    )
    getByAltText('Detach mounting plate')
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
  it('renders null if a single mount pipette is attached', () => {
    props = {
      ...props,
      selectedPipette: SINGLE_MOUNT_PIPETTES,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })

  it('renders null if flow is calibrate is attached', () => {
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
})
