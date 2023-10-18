import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import {
  mockAttachedPipette,
  mockAttachedPipetteInformation,
} from '../../../../redux/pipettes/__fixtures__'
import {
  useAttachedPipettes,
  useIsFlex,
  useAttachedPipettesFromInstrumentsQuery,
} from '../../../Devices/hooks'
import { PipetteOffsetCalibrationItems } from '../PipetteOffsetCalibrationItems'
import { OverflowMenu } from '../OverflowMenu'
import { formatLastCalibrated } from '../utils'

import type { Mount } from '@opentrons/components'
import type { AttachedPipettesByMount } from '../../../../redux/pipettes/types'

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
const mockPipetteOffsetCalibrationsForOt3 = [
  {
    modelName: 'mockPipetteModelLeft',
    serialNumber: '1234567',
    mount: 'left' as Mount,
    lastCalibrated: '2022-11-10T18:15:02',
  },
]

jest.mock('../../../../redux/custom-labware/selectors')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../assets/labware/findLabware')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../OverflowMenu')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: mockAttachedPipette,
} as any
const mockUpdateRobotStatus = jest.fn()
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockOverflowMenu = OverflowMenu as jest.MockedFunction<
  typeof OverflowMenu
>
const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
>

describe('PipetteOffsetCalibrationItems', () => {
  let props: React.ComponentProps<typeof PipetteOffsetCalibrationItems>

  beforeEach(() => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
    mockOverflowMenu.mockReturnValue(<div>mock overflow menu</div>)
    mockUseAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(false)
    props = {
      robotName: ROBOT_NAME,
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrations,
      updateRobotStatus: mockUpdateRobotStatus,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render table headers', () => {
    const [{ getByText }] = render(props)
    getByText('Pipette Model and Serial')
    getByText('Mount')
    getByText('Tip Rack')
    getByText('Last Calibrated')
  })

  it('should omit tip rack table header for OT-3', () => {
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)
    const [{ getByText, queryByText }] = render(props)
    getByText('Pipette Model and Serial')
    getByText('Mount')
    expect(queryByText('Tip Rack')).toBeNull()
    getByText('Last Calibrated')
  })

  it('should include the correct information for OT-3 when 1 pipette is attached', () => {
    props = {
      ...props,
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrationsForOt3,
    }
    mockUseIsFlex.mockReturnValue(true)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    const [{ getByText }] = render(props)
    getByText('mockPipetteModelLeft')
    getByText('1234567')
    getByText('left')
    getByText('11/10/2022 18:15:02')
  })

  it('should render overflow menu', () => {
    const [{ queryAllByText }] = render(props)
    expect(queryAllByText('mock overflow menu')).toHaveLength(2)
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

  it('should only render text when calibration missing', () => {
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
    getByText('Not calibrated')
  })

  it('should only render last calibrated date text when calibration recommended', () => {
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
    const [{ getByText, queryByText }] = render(props)
    expect(queryByText('Not calibrated')).not.toBeInTheDocument()
    getByText(formatLastCalibrated('2022-11-10T18:15:02'))
  })
})
