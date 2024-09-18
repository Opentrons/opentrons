import React from 'react'
import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { i18n } from '/app/i18n'
import { handleInstrumentDetailOverflowMenu } from '../InstrumentDetailOverflowMenu'
import { useNotifyCurrentMaintenanceRun } from '../../../../resources/maintenance_runs'
import { PipetteWizardFlows } from '../../../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../../../organisms/GripperWizardFlows'
import { useDropTipWizardFlows } from '../../../../organisms/DropTipWizardFlows'

import type { Mock } from 'vitest'
import type {
  PipetteData,
  GripperData,
  HostConfig,
} from '@opentrons/api-client'
import type * as SharedData from '@opentrons/shared-data'

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof SharedData>()
  return {
    ...actual,
    getPipetteModelSpecs: vi.fn(),
  }
})
vi.mock('../../../../resources/maintenance_runs')
vi.mock('../../../../organisms/PipetteWizardFlows')
vi.mock('../../../../organisms/GripperWizardFlows')
vi.mock('../../../../organisms/DropTipWizardFlows')

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
} as any

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

const MOCK_HOST: HostConfig = { hostname: 'TEST_HOST' }

const render = (pipetteOrGripper: PipetteData | GripperData) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <button
        onClick={() =>
          handleInstrumentDetailOverflowMenu(pipetteOrGripper, MOCK_HOST)
        }
        data-testid="testButton"
      />
    </NiceModal.Provider>,
    {
      i18nInstance: i18n,
    }
  )
}

let mockToggleDTWiz: Mock

describe('UpdateBuildroot', () => {
  mockToggleDTWiz = vi.fn()

  beforeEach(() => {
    vi.mocked(getPipetteModelSpecs).mockReturnValue({
      displayName: 'mockPipette',
    } as any)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: 'test',
        },
      },
    } as any)
    vi.mocked(useDropTipWizardFlows).mockReturnValue({
      showDTWiz: false,
      toggleDTWiz: mockToggleDTWiz,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders appropriate options when the instrument is a pipette', () => {
    render(MOCK_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    screen.getByText('Recalibrate')
    screen.getByText('Drop tips')
  })

  it('renders appropriate options when the instrument is a pipette without calibration', () => {
    render(MOCK_PIPETTE_WITHOUT_CALIBRATION)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    expect(screen.queryByText('Recalibrate')).not.toBeInTheDocument()
    screen.getByText('Drop tips')
  })

  it('renders appropriate options when the instrument is a gripper', () => {
    render(MOCK_GRIPPER)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    screen.getByText('Recalibrate')
    expect(screen.queryByText('Drop tips')).not.toBeInTheDocument()
  })

  it('renders the pipette calibration wizard  when recalibrate is clicked', () => {
    render(MOCK_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(screen.getByText('Recalibrate'))
    expect(vi.mocked(PipetteWizardFlows)).toHaveBeenCalled()
  })

  it('renders the drop tip wizard  when Drop tips is clicked', () => {
    render(MOCK_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(screen.getByText('Drop tips'))

    expect(vi.mocked(mockToggleDTWiz)).toHaveBeenCalled()
  })

  it('renders the gripper calibration wizard when recalibrate is clicked', () => {
    render(MOCK_GRIPPER)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)
    fireEvent.click(screen.getByText('Recalibrate'))

    expect(vi.mocked(GripperWizardFlows)).toHaveBeenCalled()
  })

  it('closes the overflow menu when a click occurs outside of the overflow menu', () => {
    render(MOCK_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)
    const menuListElement = screen.getByLabelText(
      'BackgroundOverlay_ModalShell'
    )
    fireEvent.click(menuListElement)

    expect(screen.queryByText('Recalibrate')).not.toBeInTheDocument()
  })
})
