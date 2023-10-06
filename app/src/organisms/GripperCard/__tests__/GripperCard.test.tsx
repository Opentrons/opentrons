import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
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
    const { getByText, getByRole } = render(props)
    const image = getByRole('img', { name: 'Flex Gripper' })
    expect(image.getAttribute('src')).toEqual('flex_gripper.png')
    getByText('extension mount')
    getByText('Flex Gripper')
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    getByText('Recalibrate gripper')
    getByText('Detach gripper')
    getByText('About gripper')
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
    }

    const { getByText } = render(props)
    getByText('Calibration needed.')
  })
  it('opens the about gripper slideout when button is pressed', () => {
    const { getByText, getByRole } = render(props)
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    overflowButton.click()
    const aboutGripperButton = getByText('About gripper')
    aboutGripperButton.click()
    getByText('about gripper')
  })
  it('renders wizard flow when recalibrate button is pressed', () => {
    const { getByText, getByRole } = render(props)
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    overflowButton.click()
    const recalibrateGripperButton = getByText('Recalibrate gripper')
    recalibrateGripperButton.click()
    getByText('wizard flow launched')
  })
  it('renders wizard flow when detach button is pressed', () => {
    const { getByText, getByRole } = render(props)
    const overflowButton = getByRole('button', {
      name: /InstrumentCard_overflowMenu/i,
    })
    overflowButton.click()
    const detachGripperButton = getByText('Detach gripper')
    detachGripperButton.click()
    getByText('wizard flow launched')
  })
  it('renders wizard flow when attach button is pressed', () => {
    props = {
      attachedGripper: null,
      isCalibrated: false,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
    }
    const { getByText, getByRole } = render(props)
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    overflowButton.click()
    const attachGripperButton = getByText('Attach gripper')
    attachGripperButton.click()
    getByText('wizard flow launched')
  })
  it('renders firmware update needed state if gripper is bad', () => {
    props = {
      attachedGripper: {
        ok: false,
      } as any,
      isCalibrated: false,
      setSubsystemToUpdate: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('Extension mount')
    getByText('Instrument attached')
    getByText('Firmware update available.')
    getByText('Update now').click()
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
    }
    const { getByText } = render(props)
    getByText('Extension mount')
    getByText('Instrument attached')
    getByText('Firmware update in progress...')
  })
})
