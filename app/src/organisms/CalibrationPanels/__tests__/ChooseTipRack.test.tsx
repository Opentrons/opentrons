import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { mockAttachedPipette } from '../../../redux/pipettes/__fixtures__'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import { mockTipRackDefinition } from '../../../redux/custom-labware/__fixtures__'
import { Select } from '../../../atoms/SelectField/Select'
import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
  getTipLengthCalibrations,
} from '../../../redux/calibration'
import { getCustomTipRackDefinitions } from '../../../redux/custom-labware'
import { ChooseTipRack } from '../ChooseTipRack'

import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../redux/pipettes/selectors')
jest.mock('../../../redux/calibration/')
jest.mock('../../../redux/custom-labware/selectors')
jest.mock('../../../atoms/SelectField/Select')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: null,
} as any

const mockGetCalibrationForPipette = getCalibrationForPipette as jest.MockedFunction<
  typeof getCalibrationForPipette
>
const mockGetTipLengthForPipetteAndTiprack = getTipLengthForPipetteAndTiprack as jest.MockedFunction<
  typeof getTipLengthForPipetteAndTiprack
>
const mockGetTipLengthCalibrations = getTipLengthCalibrations as jest.MockedFunction<
  typeof getTipLengthCalibrations
>
const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockGetCustomTipRackDefinitions = getCustomTipRackDefinitions as jest.MockedFunction<
  typeof getCustomTipRackDefinitions
>
const mockSelect = Select as jest.MockedFunction<typeof Select>

const render = (props: React.ComponentProps<typeof ChooseTipRack>) => {
  return renderWithProviders(<ChooseTipRack {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ChooseTipRack', () => {
  let props: React.ComponentProps<typeof ChooseTipRack>

  beforeEach(() => {
    mockSelect.mockReturnValue(<div>mock select</div>)
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(null)
    mockGetTipLengthCalibrations.mockReturnValue([])
    mockUsePipettesQuery.mockReturnValue({
      data: mockAttachedPipettes,
    } as any)
    mockGetCustomTipRackDefinitions.mockReturnValue([
      mockTipRackDefinition,
      mockDeckCalTipRack.definition,
    ])
    props = {
      tipRack: mockDeckCalTipRack,
      mount: LEFT,
      chosenTipRack: null,
      handleChosenTipRack: jest.fn(),
      closeModal: jest.fn(),
      robotName: 'otie',
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the correct text', () => {
    const { getByText, getByAltText } = render(props)
    getByText('Choose a tip rack')
    getByText('select tip rack')
    getByText('mock select')
    getByText(
      'Choose what tip rack you’d like to use to calibrate your tip length.'
    )
    getByText('Want to use a tip rack that’s not listed here?')

    getByText(
      'Opentrons tip racks are highly recommended. Accuracy cannot be guaranteed with other tip racks.'
    )
    getByText('300ul Tiprack FIXTURE')
    getByAltText('300ul Tiprack FIXTURE image')
    getByText(
      'It’s extremely important to perform this calibration using the Opentrons tips and tip racks specified above, as the robot determines accuracy based on the known measurements of these tips.'
    )
  })

  it('renders the buttons and they work as expected', () => {
    const { getByRole } = render(props)
    getByRole('link', { name: 'Need help?' })
    const cancel = getByRole('button', { name: 'cancel' })
    const confirm = getByRole('button', { name: 'Confirm tip rack' })
    fireEvent.click(cancel)
    expect(props.closeModal).toHaveBeenCalled()
    fireEvent.click(confirm)
    expect(props.handleChosenTipRack).toHaveBeenCalled()
  })
})
