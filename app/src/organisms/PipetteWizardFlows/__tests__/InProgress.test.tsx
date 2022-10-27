import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { FLOWS, SECTIONS } from '../constants'
import { InProgress } from '../InProgress'

const render = (props: React.ComponentProps<typeof InProgress>) => {
  return renderWithProviders(<InProgress {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InProgress', () => {
  let props: React.ComponentProps<typeof InProgress>
  beforeEach(() => {
    props = {
      mount: LEFT,
      flowType: FLOWS.CALIBRATE,
      currentStepSection: SECTIONS.BEFORE_BEGINNING,
    }
  })
  it('returns the correct information for in progress modal during calibration flow and not attach stem step ', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('Stand Back, Robot is in Motion')
    getByLabelText('spinner')
  })

  it('returns the correct information for in progress modal during calibration flow and at the attach stem step ', () => {
    props = {
      ...props,
      currentStepSection: SECTIONS.ATTACH_STEM,
    }
    const { getByText, getByAltText } = render(props)
    getByText('Stand Back, Pipette is Calibrating')
    getByAltText('Pipette is calibrating')
  })
})
