import React from 'react'
import { when } from 'jest-when'
import { useParams } from 'react-router-dom'

import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import {
  getPipetteModelSpecs,
  getGripperDisplayName,
} from '@opentrons/shared-data'

import { i18n } from '../../../../i18n'
import { InstrumentDetail } from '..'

import type { Instruments } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getPipetteModelSpecs: jest.fn(),
  getGripperDisplayName: jest.fn(),
}))
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useHistory: jest.fn(),
}))

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>

const render = () => {
  return renderWithProviders(<InstrumentDetail />, {
    i18nInstance: i18n,
  })
}

describe('InstrumentDetail', () => {
  let mockInstrumentsQuery: Instruments

  beforeEach(() => {
    mockInstrumentsQuery = {
      data: [
        {
          mount: 'left',
          instrumentType: 'pipette',
          instrumentModel: 'p1000_single_v3.4',
          serialNumber: 'P1KSV3420230721',
          subsystem: 'pipette_left',
          ok: true,
          firmwareVersion: '40',
          data: {
            channels: 1,
            min_volume: 5.0,
            max_volume: 1000.0,
            calibratedOffset: {
              offset: {
                x: 0.6796875,
                y: -0.0703125,
                z: -0.11325000000002206,
              },
              source: 'user',
              last_modified: '2023-10-11T22:25:44.858359+00:00',
              reasonability_check_failures: [],
            },
          },
          instrumentName: 'p1000_single_flex',
        },
      ],
      meta: {
        cursor: 0,
        totalLength: 1,
      },
    }
    mockUseInstrumentsQuery.mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)
    when(getPipetteModelSpecs).mockReturnValue({
      displayName: 'mockPipette',
    } as any)
    when(getGripperDisplayName).mockReturnValue('mockGripper')
    mockUseParams.mockReturnValue({ mount: 'left' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('displays header containing the instrument name and an overflow menu button', () => {
    const [{ getByText, getByLabelText }] = render()

    getByText('mockPipette')
    getByLabelText('overflow menu button')
  })

  it('renders the gripper name if the instrument is a gripper', () => {
    mockUseParams.mockReturnValue({ mount: 'extension' })
    const [{ getByText }] = render()

    getByText('mockGripper')
  })

  it('does not display the overflow menu button when instrument is not ok', () => {
    mockInstrumentsQuery = {
      ...mockInstrumentsQuery,
      data: mockInstrumentsQuery.data.map(item => ({
        ...item,
        ok: false,
      })),
    } as any

    when(mockUseInstrumentsQuery).mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)

    const [{ queryByText }] = render()

    expect(queryByText('overflow menu button')).not.toBeInTheDocument()
  })

  it('renders calibration date when present', () => {
    const [{ getByText }] = render()

    getByText('last calibrated')
    getByText('10/11/23 18:25 UTC')
  })

  it("renders 'No calibration data' when no calibration data is present", () => {
    mockInstrumentsQuery = {
      ...mockInstrumentsQuery,
      data: mockInstrumentsQuery.data.map((item: any) => ({
        ...item,
        data: { ...item.data, calibratedOffset: null },
      })),
    }
    mockUseInstrumentsQuery.mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)
    const [{ getByText }] = render()
    getByText('last calibrated')
    getByText('No calibration data')
  })

  it('renders firmware version information', () => {
    const [{ getByText }] = render()
    getByText('firmware version')
    getByText('40')
  })

  it('renders serial number information', () => {
    const [{ getByText }] = render()
    getByText('serial number')
    getByText('P1KSV3420230721')
  })

  it('renders detach and recalibrate buttons if calibration data exists', () => {
    const [{ getByText }] = render()
    getByText('detach')
    getByText('recalibrate')
  })

  it('renders detach and calibration buttons if no calibration data exists', () => {
    mockInstrumentsQuery = {
      ...mockInstrumentsQuery,
      data: mockInstrumentsQuery.data.map((item: any) => ({
        ...item,
        data: { ...item.data, calibratedOffset: null },
      })),
    }
    mockUseInstrumentsQuery.mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)

    const [{ getByText }] = render()
    getByText('detach')
    getByText('calibrate')
  })
})
