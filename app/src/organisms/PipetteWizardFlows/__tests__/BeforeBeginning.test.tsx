import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { NeedHelpLink } from '../../CalibrationPanels'
import { BeforeBeginning } from '../BeforeBeginning'
import { FLOWS } from '../constants'

jest.mock('../../CalibrationPanels')

const mockNeedHelpLink = NeedHelpLink as jest.MockedFunction<
  typeof NeedHelpLink
>

const render = (props: React.ComponentProps<typeof BeforeBeginning>) => {
  return renderWithProviders(<BeforeBeginning {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('BeforeBeginning', () => {
  let props: React.ComponentProps<typeof BeforeBeginning>
  beforeEach(() => {
    props = {
      mount: LEFT,
      proceed: jest.fn(),
      flowType: FLOWS.CALIBRATE,
      goBack: jest.fn(),
    }
    mockNeedHelpLink.mockReturnValue(<div>mock need help link</div>)
  })
  it('returns the correct information for calibrate flow', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the right hand side of the door opening.'
    )
    getByText('You will need:')
    getByText('mock need help link')
    getByAltText('Calibration Probe')
    const proceedBtn = getByRole('button', { name: 'Get started' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
})
