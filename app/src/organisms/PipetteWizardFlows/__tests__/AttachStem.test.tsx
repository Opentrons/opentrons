import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { FLOWS } from '../constants'
import { AttachStem } from '../AttachStem'

const render = (props: React.ComponentProps<typeof AttachStem>) => {
  return renderWithProviders(<AttachStem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachStem', () => {
  let props: React.ComponentProps<typeof AttachStem>
  beforeEach(() => {
    props = {
      mount: LEFT,
      proceed: jest.fn(),
      flowType: FLOWS.CALIBRATE,
      goBack: jest.fn(),
    }
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Attach Calibration Stem')
    getByText('Grab your calibration probe, install')
    getByAltText('Attach stem')
    const proceedBtn = getByRole('button', { name: 'Initiate calibration' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
})
