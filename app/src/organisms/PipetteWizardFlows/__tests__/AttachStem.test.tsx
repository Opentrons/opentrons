import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockP300PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { AttachStem } from '../AttachStem'
import type { AttachedPipette } from '../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof AttachStem>) => {
  return renderWithProviders(<AttachStem {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockP300PipetteSpecs,
}
describe('AttachStem', () => {
  let props: React.ComponentProps<typeof AttachStem>
  let mockCreateCommand = jest.fn()
  beforeEach(() => {
    mockCreateCommand = jest.fn()
    mockCreateCommand.mockResolvedValue(null)
    props = {
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: { createCommand: mockCreateCommand } as any,
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.CALIBRATE,
      isRobotMoving: false,
    }
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Attach Calibration Stem')
    getByText('Grab your calibration probe, install')
    getByAltText('Attach stem')
    const proceedBtn = getByRole('button', { name: 'Initiate calibration' })
    fireEvent.click(proceedBtn)
    expect(mockCreateCommand).toHaveBeenCalledWith([
      {
        commandType: 'calibration/moveToLocation',
        params: { pipetteId: 'abc', location: 'probePosition' },
      },
      {
        commandType: 'calibration/calibratePipette',
        params: { mount: 'left' },
      },
      {
        commandType: 'calibration/moveToLocation',
        params: { pipetteId: 'abc', location: 'attachOrDetach' },
      },
    ])
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })

  it('returns the correct information when robot is in motion', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText, getByAltText } = render(props)
    getByText('Stand Back, Pipette is Calibrating')
    getByAltText('Pipette is calibrating')
  })
})
