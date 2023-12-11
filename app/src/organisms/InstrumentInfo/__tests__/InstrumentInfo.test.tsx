import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockPipetteData1Channel } from '../../../redux/pipettes/__fixtures__'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { GripperWizardFlows } from '../../GripperWizardFlows'
import { InstrumentInfo } from '..'

import type { GripperData } from '@opentrons/api-client'

const mockPush = jest.fn()

jest.mock('../../PipetteWizardFlows')
jest.mock('../../GripperWizardFlows')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockPipetteWizardFlows = PipetteWizardFlows as jest.MockedFunction<
  typeof PipetteWizardFlows
>

const mockGripperWizardFlows = GripperWizardFlows as jest.MockedFunction<
  typeof GripperWizardFlows
>
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
    mockPipetteWizardFlows.mockReturnValue(<div>mock PipetteWizardFlows</div>)
    mockGripperWizardFlows.mockReturnValue(<div>mock GripperWizardFlows</div>)
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
    fireEvent.click(screen.getByRole('button', { name: 'MediumButton_secondary' }))
    screen.getByText('mock GripperWizardFlows')
    fireEvent.click(screen.getByRole('button', { name: 'MediumButton_primary' }))
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
    fireEvent.click(screen.getByRole('button', { name: 'MediumButton_secondary' }))
    screen.getByText('mock GripperWizardFlows')
    fireEvent.click(screen.getByRole('button', { name: 'MediumButton_primary' }))
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
    fireEvent.click(screen.getByRole('button', { name: 'MediumButton_secondary' }))
    screen.getByText('mock PipetteWizardFlows')
    expect(screen.queryByText('Calibrate')).not.toBeInTheDocument()
  })
})
