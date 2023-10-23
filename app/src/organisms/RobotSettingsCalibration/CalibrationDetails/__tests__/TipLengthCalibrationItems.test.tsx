import * as React from 'react'
import { renderWithProviders, Mount } from '@opentrons/components'
import { i18n } from '../../../../i18n'

import { TipLengthCalibrationItems } from '../TipLengthCalibrationItems'
import { OverflowMenu } from '../OverflowMenu'

jest.mock('../../../../redux/custom-labware/selectors')
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../assets/labware/findLabware')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../OverflowMenu')

const ROBOT_NAME = 'otie'

const mockOverflowMenu = OverflowMenu as jest.MockedFunction<
  typeof OverflowMenu
>

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
    tiprack: 'opentrons/opentrons_96_tiprack_1000ul/1',
    pipette: 'Mock-P1KSV222021011802',
    lastCalibrated: '2022-11-10T18:14:01',
    markedBad: false,
  },
  {
    tiprack: 'opentrons/opentrons_96_tiprack_1000ul/1',
    pipette: 'Mock-P2KSV222021011802',
    lastCalibrated: '2022-11-10T18:15:02',
    markedBad: false,
  },
]

const mockUpdateRobotStatus = jest.fn()

const render = (
  props: React.ComponentProps<typeof TipLengthCalibrationItems>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TipLengthCalibrationItems {...props} />, {
    i18nInstance: i18n,
  })
}
describe('TipLengthCalibrationItems', () => {
  let props: React.ComponentProps<typeof TipLengthCalibrationItems>

  beforeEach(() => {
    mockOverflowMenu.mockReturnValue(<div>mock overflow menu</div>)
    props = {
      robotName: ROBOT_NAME,
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrations,
      formattedTipLengthCalibrations: mockTipLengthCalibrations,
      updateRobotStatus: mockUpdateRobotStatus,
    }
  })

  it('should render table headers', () => {
    const [{ getByText }] = render(props)
    getByText('Tip Rack')
    getByText('Pipette Model and Serial')
    getByText('Last Calibrated')
  })

  it('should render overFlow menu', () => {
    const [{ queryAllByText }] = render(props)
    expect(queryAllByText('mock overflow menu')).toHaveLength(2)
  })

  it('should render tip length calibrations data', () => {
    const [{ getByText }] = render(props)
    // todo tiprack
    getByText('Mock-P1KSV222021011802')
    getByText('11/10/2022 18:14:01')

    getByText('Mock-P2KSV222021011802')
    getByText('11/10/2022 18:15:02')
  })
})
