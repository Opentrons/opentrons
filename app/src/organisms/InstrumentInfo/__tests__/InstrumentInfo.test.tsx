import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockPipetteData1Channel } from '../../../redux/pipettes/__fixtures__'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { GripperWizardFlows } from '../../GripperWizardFlows'
import { InstrumentInfo } from '..'

import type { GripperData } from '@opentrons/api-client'
import type * as Dom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('../../PipetteWizardFlows')
vi.mock('../../GripperWizardFlows')
vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof Dom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof InstrumentInfo>) => {
  return renderWithProviders(<InstrumentInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockGripperData: GripperData = {
  data: {
    jawState: 'mockJawState',
    calibratedOffset: {
      offset: { x: 1, y: 2, z: 1 },
      source: 'mockSource',
    },
  },
  firmwareVersion: '12',
  instrumentModel: 'gripperModel_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: '123',
  subsystem: 'gripper',
  ok: true,
}

const mockGripperDataWithCalData: GripperData = {
  data: {
    jawState: 'mockJawState',
    calibratedOffset: {
      offset: { x: 1, y: 2, z: 1 },
      source: 'mockSource',
      last_modified: '2023-08-15T20:25',
    },
  },
  firmwareVersion: '12',
  instrumentModel: 'gripperModel_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: '123',
  subsystem: 'gripper',
  ok: true,
}

describe('InstrumentInfo', () => {
  let props: React.ComponentProps<typeof InstrumentInfo>
  beforeEach(() => {
    vi.mocked(PipetteWizardFlows).mockReturnValue(
      <div>mock PipetteWizardFlows</div>
    )
    vi.mocked(GripperWizardFlows).mockReturnValue(
      <div>mock GripperWizardFlows</div>
    )
    props = {
      instrument: mockGripperData,
    }
  })
  it('returns the correct information for a gripper with no cal data', () => {
    render(props)
    screen.getByText('last calibrated')
    screen.getByText('No calibration data')
    screen.getByText('firmware version')
    screen.getByText('12')
    screen.getByText('serial number')
    screen.getByText('123')
    fireEvent.click(screen.getByRole('button', { name: 'detach' }))
    screen.getByText('mock GripperWizardFlows')
    fireEvent.click(screen.getByRole('button', { name: 'calibrate' }))
    screen.getByText('mock GripperWizardFlows')
  })

  it('returns the correct information for a gripper with cal data', () => {
    props = {
      instrument: mockGripperDataWithCalData,
    }
    render(props)
    screen.getByText('last calibrated')
    screen.getByText('8/15/23 20:25 UTC')
    screen.getByText('firmware version')
    screen.getByText('12')
    screen.getByText('serial number')
    screen.getByText('123')
    fireEvent.click(screen.getByRole('button', { name: 'detach' }))
    screen.getByText('mock GripperWizardFlows')
    fireEvent.click(screen.getByRole('button', { name: 'recalibrate' }))
    screen.getByText('mock GripperWizardFlows')
  })

  it('returns the correct information for a pipette with cal data and no firmware version', () => {
    props = {
      instrument: mockPipetteData1Channel,
    }
    render(props)
    screen.getByText('last calibrated')
    screen.getByText('8/25/20 20:25 UTC')
    screen.getByText('serial number')
    screen.getByText('abc')
    fireEvent.click(screen.getByRole('button', { name: 'detach' }))
    screen.getByText('mock PipetteWizardFlows')
    expect(screen.queryByText('Calibrate')).not.toBeInTheDocument()
  })
})
