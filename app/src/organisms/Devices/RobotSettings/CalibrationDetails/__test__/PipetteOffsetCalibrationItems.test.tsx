import * as React from 'react'

import { renderWithProviders, Mount } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { PipetteOffsetCalibrationItems } from '../PipetteOffsetCalibrationItems'

const render = (
  props: React.ComponentProps<typeof PipetteOffsetCalibrationItems>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<PipetteOffsetCalibrationItems {...props} />, {
    i18nInstance: i18n,
  })
}

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

jest.mock('../../../../../redux/custom-labware/selectors')
jest.mock('../../../../../redux/config')
jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../../redux/discovery')
jest.mock('../../../../../assets/labware/findLabware')

describe('PipetteOffsetCalibrationItems', () => {
  let props: React.ComponentProps<typeof PipetteOffsetCalibrationItems>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrations,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render table headers', () => {
    const [{ getByText }] = render(props)
    getByText('Pipette Model and Serial')
    getByText('Mount')
    getByText('Tip Rack')
    getByText('Last Calibrated')
  })

  it('should render overFlow menu', () => {
    const [{ getAllByRole }] = render(props)
    const buttons = getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('should render pipette offset calibrations data - unknown custom tiprack', () => {
    const [{ getByText }] = render(props)
    getByText('mockPipetteModelLeft')
    getByText('1234567')
    getByText('left')
    getByText('11/10/2022 18:14:01')
    getByText('mockPipetteModelRight')
    getByText('01234567')
    getByText('right')
    getByText('11/10/2022 18:15:02')
  })

  it('should render icon and text when calibration missing', () => {
    props = {
      ...props,
      formattedPipetteOffsetCalibrations: [
        {
          modelName: 'mockPipetteModelLeft',
          serialNumber: '1234567',
          mount: 'left' as Mount,
          tiprack: 'mockTiprackLeft',
          markedBad: false,
        },
      ],
    }
    const [{ getByText }] = render(props)
    getByText('Missing calibration')
  })

  it('should render icon and test when calibration recommended', () => {
    props = {
      ...props,
      formattedPipetteOffsetCalibrations: [
        {
          modelName: 'mockPipetteModelLeft',
          serialNumber: '1234567',
          mount: 'left' as Mount,
          tiprack: 'mockTiprackLeft',
          lastCalibrated: '2022-11-10T18:15:02',
          markedBad: true,
        },
      ],
    }
    const [{ getByText }] = render(props)
    getByText('Recalibration recommended')
  })
})
