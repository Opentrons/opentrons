import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { GripperWizardFlows } from '../../GripperWizardFlows'
import { ProtocolInstrumentMountItem } from '..'

jest.mock('../../PipetteWizardFlows')
jest.mock('../../GripperWizardFlows')
jest.mock('../../TakeoverModal')

const mockPipetteWizardFlows = PipetteWizardFlows as jest.MockedFunction<
  typeof PipetteWizardFlows
>
const mockGripperWizardFlows = GripperWizardFlows as jest.MockedFunction<
  typeof GripperWizardFlows
>

const mockGripperData = {
  instrumentModel: 'gripper_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: 'ghi789',
  data: {
    calibratedOffset: {
      offset: {
        x: 1,
        y: 2,
        z: 4,
      },
      source: 'standard',
      last_modified: undefined,
    },
  },
  subsystem: 'gripper',
  ok: true,
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_multi_flex',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
  data: {
    calibratedOffset: {
      offset: {
        x: 1,
        y: 2,
        z: 4,
      },
      source: 'standard',
      last_modified: 'date',
    },
  },
  subsystem: 'pipette_left',
  ok: true,
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
      speccedName: 'p1000_multi_flex',
    }
    mockPipetteWizardFlows.mockReturnValue(<div>pipette wizard flow</div>)
    mockGripperWizardFlows.mockReturnValue(<div>gripper wizard flow</div>)
  })

  it('renders the correct information when there is no pipette attached', () => {
    render(props)
    screen.getByText('Left Mount')
    screen.getByText('No data')
    screen.getByText('Flex 8-Channel 1000 μL')
    screen.getByText('Attach')
    fireEvent.click(screen.getByRole('button'))
    screen.getByText('pipette wizard flow')
  })
  it('renders the correct information when there is no pipette attached for 96 channel', () => {
    props = {
      ...props,
      speccedName: 'p1000_96',
    }
    render(props)
    screen.getByText('Left + Right Mount')
    screen.getByText('No data')
    screen.getByText('Flex 96-Channel 1000 μL')
    screen.getByText('Attach')
  })
  it('renders the correct information when there is a pipette attached with cal data', () => {
    props = {
      ...props,
      mount: LEFT,
      attachedInstrument: mockLeftPipetteData as any,
    }
    render(props)
    screen.getByText('Left Mount')
    screen.getByText('Calibrated')
    screen.getByText('Flex 8-Channel 1000 μL')
  })
  it('renders the pipette with no cal data and the calibration button and clicking on it launches the correct flow', () => {
    props = {
      ...props,
      mount: LEFT,
      attachedInstrument: {
        ...mockLeftPipetteData,
        data: {
          calibratedOffset: null,
        },
      } as any,
    }
    render(props)
    screen.getByText('Left Mount')
    screen.getByText('No data')
    screen.getByText('Flex 8-Channel 1000 μL')
    const button = screen.getByText('Calibrate')
    fireEvent.click(button)
    screen.getByText('pipette wizard flow')
  })
  it('renders the attach button and clicking on it launches the correct flow', () => {
    props = {
      ...props,
      mount: LEFT,
    }
    render(props)
    screen.getByText('Left Mount')
    screen.getByText('No data')
    screen.getByText('Flex 8-Channel 1000 μL')
    const button = screen.getByText('Attach')
    fireEvent.click(button)
    screen.getByText('pipette wizard flow')
  })
  it('renders the correct information when gripper needs to be attached', () => {
    props = {
      ...props,
      mount: 'extension',
      speccedName: 'gripperV1',
    }
    render(props)
    screen.getByText('Extension Mount')
    screen.getByText('No data')
    screen.getByText('Flex Gripper')
    const button = screen.getByText('Attach')
    fireEvent.click(button)
    screen.getByText('gripper wizard flow')
  })
  it('renders the correct information when gripper is attached but not calibrated', () => {
    props = {
      ...props,
      mount: 'extension',
      speccedName: 'gripperV1',
      attachedInstrument: mockGripperData as any,
    }
    render(props)
    screen.getByText('Extension Mount')
    screen.getByText('Flex Gripper')
    const button = screen.getByText('Calibrate')
    fireEvent.click(button)
    screen.getByText('gripper wizard flow')
  })
  it('renders the correct information when an instrument is attached and calibrated', () => {
    props = {
      ...props,
      mount: LEFT,
      attachedInstrument: {
        ...mockLeftPipetteData,
      } as any,
    }
    const { getByText } = render(props)
    getByText('Left Mount')
    getByText('Calibrated')
    const button = getByText('Recalibrate')
    fireEvent.click(button)
    getByText('pipette wizard flow')
  })
})
