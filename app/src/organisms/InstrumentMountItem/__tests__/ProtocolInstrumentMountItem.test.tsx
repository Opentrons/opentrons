import * as React from 'react'
import { LEFT, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ProtocolInstrumentMountItem } from '..'

const mockGripperData = {
  instrumentModel: 'gripper_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: 'ghi789',
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_multi_gen3',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
}

const render = (
  props: React.ComponentProps<typeof ProtocolInstrumentMountItem>
) => {
  return renderWithProviders(<ProtocolInstrumentMountItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolInstrumentMountItem', () => {
  let props: React.ComponentProps<typeof ProtocolInstrumentMountItem>
  beforeEach(() => {
    props = {
      mount: LEFT,
      attachedInstrument: null,
      attachedCalibrationData: null,
      speccedName: 'p1000_multi_gen3',
    }
  })

  it('renders the correct information when there is no pipette attached', () => {
    const { getByText } = render(props)
    getByText('Left mount')
    getByText('No data')
    getByText('Flex 8-Channel 1000 μL')
    getByText('Attach')
  })
  it('renders the correct information when there is a pipette attached with cal data', () => {
    props = {
      ...props,
      mount: LEFT,
      attachedInstrument: mockLeftPipetteData as any,
    }
    const { getByText } = render(props)
    getByText('Left mount')
    getByText('Calibrated')
    getByText('Flex 8-Channel 1000 μL')
    getByText('Calibrate')
  })
  it.todo(
    'renders the pipette with no cal data and the calibration button and clicking on it launches the correct flow '
  )
  it.todo(
    'renders the attach button and clicking on it launches the correct flow '
  )
  it('renders the correct information when gripper needs to be atached', () => {
    props = {
      ...props,
      mount: 'extension',
      speccedName: 'gripperV1',
    }
    const { getByText } = render(props)
    getByText('Extension mount')
    getByText('No data')
    getByText('Gripper V1')
    getByText('Attach')
  })
  it('renders the correct information when gripper is attached', () => {
    props = {
      ...props,
      mount: 'extension',
      speccedName: 'gripperV1',
      attachedInstrument: mockGripperData as any,
    }
    const { getByText } = render(props)
    getByText('Extension mount')
    getByText('Calibrated')
    getByText('Gripper V1')
  })
})
