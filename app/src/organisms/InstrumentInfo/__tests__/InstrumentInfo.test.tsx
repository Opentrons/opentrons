import * as React from 'react'
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
      last_modified: 'mockLastModified',
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
    const { getByText, getByRole } = render(props)
    getByText('last calibrated')
    getByText('No calibration data')
    getByText('firmware version')
    getByText('12')
    getByText('serial number')
    getByText('123')
    getByRole('button', { name: 'MediumButton_secondary' }).click()
    getByText('mock GripperWizardFlows')
    getByRole('button', { name: 'MediumButton_primary' }).click()
    getByText('mock GripperWizardFlows')
  })

  it('returns the correct information for a gripper with cal data', () => {
    props = {
      instrument: mockGripperDataWithCalData,
    }
    const { getByText, getByRole } = render(props)
    getByText('last calibrated')
    getByText('mockLastModified')
    getByText('firmware version')
    getByText('12')
    getByText('serial number')
    getByText('123')
    getByRole('button', { name: 'MediumButton_secondary' }).click()
    getByText('mock GripperWizardFlows')
    getByRole('button', { name: 'MediumButton_primary' }).click()
    getByText('mock GripperWizardFlows')
  })

  it('returns the correct information for a pipette with cal data and no firmware version', () => {
    props = {
      instrument: mockPipetteData1Channel,
    }
    const { getByText, getByRole } = render(props)
    getByText('last calibrated')
    getByText('08/25/2020 20:25:00')
    getByText('serial number')
    getByText('abc')
    getByRole('button', { name: 'MediumButton_secondary' }).click()
    getByText('mock PipetteWizardFlows')
    getByRole('button', { name: 'MediumButton_primary' }).click()
    getByText('mock PipetteWizardFlows')
  })
})
