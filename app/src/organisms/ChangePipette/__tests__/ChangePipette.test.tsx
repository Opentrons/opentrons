import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { useHistory } from 'react-router-dom'

import { getPipetteNameSpecs } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { getHasCalibrationBlock } from '../../../redux/config'
import { getMovementStatus } from '../../../redux/robot-controls'
import { getCalibrationForPipette } from '../../../redux/calibration'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
import {
  getRequestById,
  SUCCESS,
  useDispatchApiRequests,
} from '../../../redux/robot-api'
import { useAttachedPipettes } from '../../Devices/hooks'
import { PipetteSelection } from '../PipetteSelection'
import { ExitModal } from '../ExitModal'
import { ConfirmPipette } from '../ConfirmPipette'
import { ChangePipette } from '..'

import type { PipetteNameSpecs } from '@opentrons/shared-data'
import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush }),
  }
})

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getPipetteNameSpecs>()
  return {
    ...actual,
    getPipetteNameSpecs: vi.fn(),
  }
})
vi.mock('../../../redux/config')
vi.mock('../../../redux/robot-controls')
vi.mock('../../../redux/calibration')
vi.mock('../../../redux/robot-api')
vi.mock('../PipetteSelection')
vi.mock('../ExitModal')
vi.mock('../../../molecules/InProgressModal/InProgressModal')
vi.mock('../ConfirmPipette')
vi.mock('../../Devices/hooks')
vi.mock('../../../assets/images')

const render = (props: React.ComponentProps<typeof ChangePipette>) => {
  return renderWithProviders(<ChangePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockP300PipetteNameSpecs = {
  name: 'p300_single_gen2',
  displayName: 'P300 Single GEN2',
  channels: 1,
  displayCategory: 'GEN2',
} as PipetteNameSpecs

const mockAttachedPipettes = {
  id: 'abc',
  name: 'p300_single_gen2',
  model: 'p300_single_v2.0',
  tip_length: 42,
  mount_axis: 'c',
  plunger_axis: 'd',
  modelSpecs: mockP300PipetteNameSpecs,
}

describe('ChangePipette', () => {
  let props: React.ComponentProps<typeof ChangePipette>
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: 'left',
      closeModal: vi.fn(),
    }
    dispatchApiRequest = vi.fn()
    vi.mocked(useAttachedPipettes).mockReturnValue({ left: null, right: null })
    vi.mocked(getRequestById).mockReturnValue(null)
    vi.mocked(getCalibrationForPipette).mockReturnValue(null)
    vi.mocked(getHasCalibrationBlock).mockReturnValue(false)
    vi.mocked(getMovementStatus).mockReturnValue(null)
    vi.mocked(getPipetteNameSpecs).mockReturnValue(null)
    vi.mocked(useDispatchApiRequests).mockReturnValue([
      dispatchApiRequest,
      ['id'],
    ])
  })

  it('renders the in progress modal when the movement status is moving', () => {
    vi.mocked(getMovementStatus).mockReturnValue('moving')
    vi.mocked(InProgressModal).mockReturnValue(
      <div>mock in progress modal</div>
    )
    const { getByText } = render(props)
    getByText('Attach a pipette')
    getByText('mock in progress modal')
  })

  it('renders the wizard pages for attaching a pipette and clicking on the exit button will render the exit modal', () => {
    vi.mocked(PipetteSelection).mockReturnValue(
      <div>mock pipette selection</div>
    )
    vi.mocked(ExitModal).mockReturnValue(<div>mock exit modal</div>)

    const { getByText, getByLabelText, getByRole } = render(props)
    //  Clear deck modal page
    let exit = getByLabelText('Exit')
    getByText('Attach a pipette')
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    fireEvent.click(exit)
    expect(props.closeModal).toHaveBeenCalled()

    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page
    getByText('Attach a pipette')
    getByText('mock pipette selection')
    exit = getByLabelText('Exit')
    fireEvent.click(exit)

    //  Exit modal page
    getByText('mock exit modal')
    getByText('Attach a pipette')
  })

  it('the go back button functions as expected', () => {
    vi.mocked(PipetteSelection).mockReturnValue(
      <div>mock pipette selection</div>
    )

    const { getByText, getByRole } = render(props)
    //  Clear deck modal page
    getByText('Before you begin')
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    getByText('Before you begin')
  })

  it('renders the wizard pages for attaching a pipette and goes through flow', () => {
    vi.mocked(PipetteSelection).mockReturnValue(
      <div>mock pipette selection</div>
    )
    const { getByText, getByRole } = render(props)
    //  Clear deck modal page
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page
    getByText('Attach a pipette')
  })

  it('renders the wizard pages for detaching a single channel pipette and exits on the 2nd page rendering exit modal', () => {
    vi.mocked(ExitModal).mockReturnValue(<div>mock exit modal</div>)
    vi.mocked(getRequestById).mockReturnValue({
      status: SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    vi.mocked(useAttachedPipettes).mockReturnValue({
      left: mockAttachedPipettes as AttachedPipette,
      right: null,
    })
    const { getByText, getByLabelText, getByRole } = render(props)

    //  Clear deck modal page
    getByLabelText('Exit')
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    let cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page 1
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Step 1 / 3')
    getByText('Loosen the screws')
    getByText(
      'Using a 2.5 mm screwdriver, loosen the three screws on the back of the pipette that is currently attached.'
    )
    cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)

    //  Instructions page 2
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Step 2 / 3')
    getByText('Remove the pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Disconnect the pipette from the robot by pulling the white connector tab.'
    )
    getByLabelText('Confirm')
    const exit = getByLabelText('Exit')
    fireEvent.click(exit)

    //  Exit modal page
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Step 2 / 3')
    getByText('mock exit modal')
  })

  it('renders the wizard pages for detaching a single channel pipette and goes through the whole flow', () => {
    vi.mocked(ConfirmPipette).mockReturnValue(<div>mock confirm pipette</div>)
    vi.mocked(useAttachedPipettes).mockReturnValue({
      left: mockAttachedPipettes as AttachedPipette,
      right: null,
    })
    const { getByLabelText, getByRole } = render(props)

    //  Clear deck modal page
    let cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page 1
    cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)

    //  Instructions page 2
    getByLabelText('Confirm')
  })
})
