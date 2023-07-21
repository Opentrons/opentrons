import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { Banner } from '../../../atoms/Banner'
import { GripperWizardFlows } from '../../GripperWizardFlows'
import { AboutGripperSlideout } from '../AboutGripperSlideout'
import { GripperCard } from '../'
import type { GripperData } from '@opentrons/api-client'

jest.mock('../../../atoms/Banner')
jest.mock('../../GripperWizardFlows')
jest.mock('../AboutGripperSlideout')

const mockBanner = Banner as jest.MockedFunction<typeof Banner>
const mockGripperWizardFlows = GripperWizardFlows as jest.MockedFunction<
  typeof GripperWizardFlows
>
const mockAboutGripperSlideout = AboutGripperSlideout as jest.MockedFunction<
  typeof AboutGripperSlideout
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
        data: {
          calibratedOffset: {
            last_modified: '12/2/4',
          },
        },
      } as GripperData,
      isCalibrated: true,
    }
    mockBanner.mockReturnValue(<>calibration needed</>)
    mockGripperWizardFlows.mockReturnValue(<>wizard flow launched</>)
    mockAboutGripperSlideout.mockReturnValue(<>about gripper</>)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct info when gripper is attached', () => {
    const { getByText, getByRole } = render(props)
    const image = getByRole('img', { name: 'flex gripper' })
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
        data: {
          calibratedOffset: {
            last_modified: undefined,
          },
        },
      } as GripperData,
      isCalibrated: false,
    }

    const { getByText } = render(props)
    getByText('calibration needed')
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
})
