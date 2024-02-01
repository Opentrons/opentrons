import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { GripperWizardFlows } from '../../GripperWizardFlows'
import { AboutGripperSlideout } from '../AboutGripperSlideout'
import { GripperCard } from '../'
import type { GripperData } from '@opentrons/api-client'

jest.mock('../../GripperWizardFlows')
jest.mock('../AboutGripperSlideout')
jest.mock('@opentrons/react-api-client')

const mockGripperWizardFlows = GripperWizardFlows as jest.MockedFunction<
  typeof GripperWizardFlows
>
const mockAboutGripperSlideout = AboutGripperSlideout as jest.MockedFunction<
  typeof AboutGripperSlideout
>
const mockUseCurrentSubsystemUpdateQuery = useCurrentSubsystemUpdateQuery as jest.MockedFunction<
  typeof useCurrentSubsystemUpdateQuery
>

const render = (props: React.ComponentProps<typeof GripperCard>) => {
  return renderWithProviders(<GripperCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('GripperCard', () => {
  let props: React.ComponentProps<typeof GripperCard>
  beforeEach(() => {
    props = {
      attachedGripper: {
        instrumentModel: 'gripperV1.1',
        serialNumber: '123',
        firmwareVersion: '12',
        ok: true,
        data: {
          calibratedOffset: {
            last_modified: '12/2/4',
          },
        },
      } as GripperData,
      isCalibrated: true,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    mockGripperWizardFlows.mockReturnValue(<>wizard flow launched</>)
    mockAboutGripperSlideout.mockReturnValue(<>about gripper</>)
    mockUseCurrentSubsystemUpdateQuery.mockReturnValue({
      data: undefined,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct info when gripper is attached', () => {
    render(props)
    const image = screen.getByRole('img', { name: 'Flex Gripper' })
    expect(image.getAttribute('src')).toEqual('flex_gripper.png')
    screen.getByText('extension mount')
    screen.getByText('Flex Gripper')
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    screen.getByText('Recalibrate gripper')
    screen.getByText('Detach gripper')
    screen.getByText('About gripper')
  })
  it('renders recalibrate banner when no calibration data is present', () => {
    props = props = {
      attachedGripper: {
        instrumentModel: 'gripperV1.1',
        serialNumber: '123',
        firmwareVersion: '12',
        ok: true,
        data: {
          calibratedOffset: {
            last_modified: undefined,
          },
        },
      } as GripperData,
      isCalibrated: false,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
      isEstopNotDisengaged: false,
    }

    render(props)
    screen.getByText('Calibration needed.')
    screen.getByText('Calibrate now')
  })

  it('renders recalibrate banner without calibrate now when no calibration data is present and e-stop is pressed', () => {
    props = {
      attachedGripper: {
        instrumentModel: 'gripperV1.1',
        serialNumber: '123',
        firmwareVersion: '12',
        ok: true,
        data: {
          calibratedOffset: {
            last_modified: undefined,
          },
        },
      } as GripperData,
      isCalibrated: false,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
      isEstopNotDisengaged: true,
    }

    render(props)
    screen.getByText('Calibration needed.')
    expect(screen.queryByText('Calibrate now')).not.toBeInTheDocument()
  })

  it('opens the about gripper slideout when button is pressed', () => {
    render(props)
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    const aboutGripperButton = screen.getByText('About gripper')
    fireEvent.click(aboutGripperButton)
    screen.getByText('about gripper')
  })
  it('renders wizard flow when recalibrate button is pressed', () => {
    render(props)
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    const recalibrateGripperButton = screen.getByText('Recalibrate gripper')
    fireEvent.click(recalibrateGripperButton)
    screen.getByText('wizard flow launched')
  })
  it('renders wizard flow when detach button is pressed', () => {
    render(props)
    const overflowButton = screen.getByRole('button', {
      name: /InstrumentCard_overflowMenu/i,
    })
    fireEvent.click(overflowButton)
    const detachGripperButton = screen.getByText('Detach gripper')
    fireEvent.click(detachGripperButton)
    screen.getByText('wizard flow launched')
  })
  it('renders wizard flow when attach button is pressed', () => {
    props = {
      attachedGripper: null,
      isCalibrated: false,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    const attachGripperButton = screen.getByText('Attach gripper')
    fireEvent.click(attachGripperButton)
    screen.getByText('wizard flow launched')
  })
  it('renders firmware update needed state if gripper is bad', () => {
    props = {
      attachedGripper: {
        ok: false,
      } as any,
      isCalibrated: false,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('Extension mount')
    screen.getByText('Instrument attached')
    screen.getByText('Firmware update available.')
    fireEvent.click(screen.getByText('Update now'))
    expect(props.setSubsystemToUpdate).toHaveBeenCalledWith('gripper')
  })
  it('renders firmware update in progress state if gripper is bad and update in progress', () => {
    mockUseCurrentSubsystemUpdateQuery.mockReturnValue({
      data: { data: { updateProgress: 50 } as any },
    } as any)
    props = {
      attachedGripper: {
        ok: false,
      } as any,
      isCalibrated: true,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
      isEstopNotDisengaged: false,
    }
    render(props)
    screen.getByText('Extension mount')
    screen.getByText('Instrument attached')
    screen.getByText('Firmware update in progress...')
  })
})
