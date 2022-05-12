import * as React from 'react'

import { renderWithProviders, Mount } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { OverflowMenu } from '../OverflowMenu'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const render = (props: React.ComponentProps<typeof OverflowMenu>) => {
  return renderWithProviders(<OverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const ROBOT_NAME = 'otie'
const CAL_TYPE = 'pipetteOffset'

jest.mock('../../../../../redux/config')
jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../../redux/discovery')

describe('OverflowMenu', () => {
  let props: React.ComponentProps<typeof OverflowMenu>

  beforeEach(() => {
    props = {
      calType: CAL_TYPE,
      robotName: ROBOT_NAME,
      serialNumber: '1234567',
      mount: 'left' as Mount,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render Overflow menu buttons - pipette offset calibrations', () => {
    const { getByText } = render(props)
    getByText('Recalibrate Pipette Offset')
    getByText('Download calibration data')
  })

  it('should render Overflow menu buttons - tip length calibrations', () => {
    props = {
      ...props,
      calType: 'tipLength',
    }
    const { getByText } = render(props)
    getByText('Recalibrate Pipette Offset')
    getByText('Download calibration data')
  })
})
