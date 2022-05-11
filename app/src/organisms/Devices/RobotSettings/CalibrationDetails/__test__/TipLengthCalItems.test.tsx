import * as React from 'react'

import { renderWithProviders, Mount } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
// import { getDisplayNameForTipRack } from '../../../../../pages/Robots/InstrumentSettings/utils'

import { TipLengthCalItems } from '../TipLengthCalItems'
import { PROFILE_ROBOT_NAME } from '../../../../../redux/support/constants'

jest.mock('../../../../../redux/custom-labware/selectors')
jest.mock('../../../../../redux/config')
jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../../redux/discovery')

const ROBOT_NAME = 'otie'

const mockPipetteOffsetCalibrations = [
  {
    modelName: 'mockPipetteModelLeft',
    serialNumber: '1234567',
    mount: 'left' as Mount,
    tiprack: 'mockTiprackLeft',
    lastCalibrated: '2022-11-10T18:14:01',
    markedBad: false,
  },
  {
    modelName: 'mockPipetteModelRight',
    serialNumber: '01234567',
    mount: 'right' as Mount,
    tiprack: 'mockTiprackRight',
    lastCalibrated: '2022-11-10T18:15:02',
    markedBad: false,
  },
]
const mockTipLengthCalibrations = [
  {
    tiprack: '',
    pipette: '',
    lastCalibrated: '',
    markedBad: false,
  },
  {
    tiprack: '',
    pipette: '',
    lastCalibrated: '',
    markedBad: false,
  },
]

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const render = (props: React.ComponentProps<typeof TipLengthCalItems>) => {
  return renderWithProviders(<TipLengthCalItems {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('PipetteOffsetCalItems', () => {
  let props: React.ComponentProps<typeof TipLengthCalItems>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
    }
  })

  it('should render table headers', () => {})

  it('should render pipette offset calibrations data', () => {})
})
