import React from 'react'
import NiceModal from '@ebay/nice-modal-react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { i18n } from '../../../../i18n'
import { handleInstrumentDetailOverflowMenu } from '../InstrumentDetailOverflowMenu'

import type { PipetteData, GripperData } from '@opentrons/api-client'

jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getPipetteModelSpecs: jest.fn(),
}))

const mockGetPipetteModelSpecs = getPipetteModelSpecs as jest.MockedFunction<
  typeof getPipetteModelSpecs
>

const MOCK_PIPETTE = {
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
} as PipetteData

const MOCK_PIPETTE_WITHOUT_CALIBRATION = {
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
  },
  instrumentName: 'p1000_single_flex',
} as PipetteData

const MOCK_GRIPPER = {
  mount: 'extension',
  instrumentType: 'gripper',
  instrumentModel: 'test',
  serialNumber: 'P1KSV3420230721',
  subsystem: 'gripper',
  ok: true,
  firmwareVersion: '40',
  data: {
    jawState: 'test',
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
} as GripperData

const render = (pipetteOrGripper: PipetteData | GripperData) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <button
        onClick={() => handleInstrumentDetailOverflowMenu(pipetteOrGripper)}
        data-testid="testButton"
      />
    </NiceModal.Provider>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('UpdateBuildroot', () => {
  beforeEach(() => {
    mockGetPipetteModelSpecs.mockReturnValue({
      displayName: 'mockPipette',
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders appropriate options when the instrument is a pipette', () => {
    const [{ getByTestId, getByText }] = render(MOCK_PIPETTE)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    getByText('Recalibrate')
    getByText('Drop tips')
  })

  it('renders appropriate options when the instrument is a pipette without calibration', () => {
    const [{ getByTestId, getByText, queryByText }] = render(
      MOCK_PIPETTE_WITHOUT_CALIBRATION
    )
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    expect(queryByText('Recalibrate')).not.toBeInTheDocument()
    getByText('Drop tips')
  })

  it('renders appropriate options when the instrument is a gripper', () => {
    const [{ getByTestId, getByText, queryByText }] = render(MOCK_GRIPPER)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    getByText('Recalibrate')
    expect(queryByText('Drop tips')).not.toBeInTheDocument()
  })

  it('renders the pipette calibration wizard  when recalibrate is clicked', () => {
    const [{ getByTestId, getByText }] = render(MOCK_PIPETTE)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(getByText('Recalibrate'))

    getByText('Calibrate Left Pipette')
  })

  it('renders the drop tip wizard  when Drop tips is clicked', () => {
    const [{ getByTestId, getByText }] = render(MOCK_PIPETTE)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(getByText('Drop tips'))

    getByText('Before you begin, do you need to preserve aspirated liquid?')
  })

  it('renders the gripper calibration wizard when recalibrate is clicked', () => {
    const [{ getByTestId, getByText }] = render(MOCK_GRIPPER)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(getByText('Recalibrate'))

    getByText('Calibrate Gripper')
  })

  it('closes the overflow menu when a launched wizard closes', () => {
    const [{ getByTestId, getByText, queryByText }] = render(MOCK_GRIPPER)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(getByText('Recalibrate'))

    getByText('Calibrate Gripper')
    fireEvent.click(getByText('exit'))
    expect(queryByText('Recalibrate')).not.toBeInTheDocument()
  })

  it('closes the overflow menu when a click occurs outside of the overflow menu', () => {
    const [{ queryByText, getByTestId, getByLabelText }] = render(MOCK_PIPETTE)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)
    const menuListElement = getByLabelText('BackgroundOverlay_ModalShell')
    fireEvent.click(menuListElement)

    expect(queryByText('Recalibrate')).not.toBeInTheDocument()
  })
})
