import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { FLOWS } from '../constants'
import { DetachStem } from '../DetachStem'

const render = (props: React.ComponentProps<typeof DetachStem>) => {
  return renderWithProviders(<DetachStem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DetachStem', () => {
  let props: React.ComponentProps<typeof DetachStem>
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
    getByText('Remove Calibration Stem')
    getByText(
      'Now you’ll be guided through removing your calibration stem. Undo the latch to remove the stem'
    )
    getByAltText('Remove stem')
    const proceedBtn = getByRole('button', { name: 'Complete calibration' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
})
