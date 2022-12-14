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
import { Carriage } from '../Carriage'

import type { AttachedPipette } from '../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof Carriage>) => {
  return renderWithProviders(<Carriage {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('Carriage', () => {
  let props: React.ComponentProps<typeof Carriage>
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
  it('returns the correct information, buttons work as expected when flow is attach', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Unscrew Z Axis Carriage')
    getByText(
      'Reach the top of of the gantry carriage and unscrew the captive screw connecting right pippete mount to the the z axis.'
    )
    getByText(
      'The detached right mount should freely move up and down the z axis.'
    )
    getByAltText('Unscrew gantry')
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
  it('returns the correct information, buttons work as expected when flow is detach', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Reattach Z Axis Carriage')
    getByText(
      'Take the right carriage and push it to the top of the z axis. Reach the top of of the gantry carriage and screw in the captive screw to connect right pippete mount to the the z axis.'
    )
    getByText(
      'The detached right mount should freely move up and down the z axis.'
    )
    getByAltText('Reattach carriage')
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
