import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { DetachProbe } from '../DetachProbe'
import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../../../molecules/InProgressModal/InProgressModal')

const mockInProgressModal = InProgressModal as jest.MockedFunction<
  typeof InProgressModal
>
const render = (props: React.ComponentProps<typeof DetachProbe>) => {
  return renderWithProviders(<DetachProbe {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('DetachProbe', () => {
  let props: React.ComponentProps<typeof DetachProbe>
  beforeEach(() => {
    props = {
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.CALIBRATE,
      handleCleanUp: jest.fn(),
      setIsBetweenCommands: jest.fn(),
      isRobotMoving: false,
    }
    mockInProgressModal.mockReturnValue(<div>mock in progress</div>)
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Remove Calibration Probe')
    getByText(
      'Unlatch the calibration probe, remove it from the pipette nozzle, and return it to its storage location.'
    )
    getByAltText('Remove probe')
    const proceedBtn = getByRole('button', { name: 'Complete calibration' })
    fireEvent.click(proceedBtn)
    expect(props.handleCleanUp).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
  it('returns the correct information for in progress modal when robot is moving', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText } = render(props)
    getByText('mock in progress')
  })
})
