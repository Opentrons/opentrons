import { act, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InlineNotification } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { OddModal } from '/app/molecules/OddModal'

import { mockRecoveryContentProps } from '../../__fixtures__'
import {
  ErrorDetailsModal,
  GripperErrorBanner,
  LabwareMissingErrorBanner,
  LabwareMissingOnShuttleErrorBanner,
  NoLiquidDetectedBanner,
  OverpressureBanner,
  StackerStallErrorBanner,
  StallErrorBanner,
  TipNotDetectedBanner,
  useErrorDetailsModal,
} from '../ErrorDetailsModal'
import { StepInfo } from '../StepInfo'

import type { ComponentProps } from 'react'

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: vi.fn((element, container) => element),
}))
vi.mock('/app/molecules/OddModal', () => ({
  OddModal: vi.fn(({ children }) => <div>{children}</div>),
}))

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InlineNotification>()
  return {
    ...actual,
    InlineNotification: vi.fn(),
  }
})
vi.mock('../StepInfo')

describe('useErrorDetailsModal', () => {
  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useErrorDetailsModal())
    expect(result.current.showModal).toBe(false)
  })

  it('should toggle the modal state when toggleModal is called', () => {
    const { result } = renderHook(() => useErrorDetailsModal())
    act(() => {
      result.current.toggleModal()
    })
    expect(result.current.showModal).toBe(true)
    act(() => {
      result.current.toggleModal()
    })
    expect(result.current.showModal).toBe(false)
  })
})

const render = (props: ComponentProps<typeof ErrorDetailsModal>) => {
  return renderWithProviders(<ErrorDetailsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorDetailsModal', () => {
  let props: ComponentProps<typeof ErrorDetailsModal>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      toggleModal: vi.fn(),
      robotType: 'OT-3 Standard',
      desktopType: 'desktop-small',
    }

    vi.mocked(StepInfo).mockReturnValue(<div>MOCK_STEP_INFO</div>)
    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  const IS_ODD = [true, false]

  it('renders the ODD modal with the correct content', () => {
    render(props)
    expect(vi.mocked(OddModal)).toHaveBeenCalledWith(
      expect.objectContaining({
        header: {
          title: 'Tip not detected',
          hasExitIcon: true,
        },
        onOutsideClick: props.toggleModal,
      }),
      {}
    )
    expect(screen.getByText('MOCK_STEP_INFO')).toBeInTheDocument()
  })

  it('renders the desktop modal with the correct content', () => {
    render({ ...props, isOnDevice: false })

    screen.getByText('MOCK_STEP_INFO')
    screen.getByText('Error details')
  })

  IS_ODD.forEach(isOnDevice => {
    it('renders an inline banner when the error kind is an overpressure error', () => {
      props.failedCommand = {
        ...props.failedCommand,
        byRunRecord: {
          ...props.failedCommand?.byRunRecord,
          commandType: 'aspirate',
          error: { isDefined: true, errorType: 'overpressure' },
        },
      } as any
      render({ ...props, isOnDevice })

      screen.getByText('MOCK_INLINE_NOTIFICATION')
    })

    it('renders an inline banner when the error kind is a tip not detected error', () => {
      props.failedCommand = {
        ...props.failedCommand,
        byRunRecord: {
          ...props.failedCommand?.byRunRecord,
          commandType: 'pickUpTip',
          error: { isDefined: true, errorType: 'tipPhysicallyMissing' },
        },
      } as any
      render({ ...props, isOnDevice })

      screen.getByText('MOCK_INLINE_NOTIFICATION')
    })

    it('does not render a banner when the error kind is not explicitly handled', () => {
      render({ ...props, isOnDevice, failedCommand: {} as any })

      expect(screen.queryByText('MOCK_INLINE_NOTIFICATION')).toBeNull()
    })
  })
})

describe('renders the InlineNotification', () => {
  beforeEach(() => {
    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  it('renders the InlineNotification for OverpressureBanner', () => {
    renderWithProviders(<OverpressureBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Overpressure is usually caused by a tip contacting labware, a clog, or moving viscous liquid too quickly',
        message:
          ' If the issue persists, cancel the run and make the necessary changes to the protocol',
      }),
      {}
    )
  })

  it('renders the InlineNotification for TipNotDetectedBanner', () => {
    renderWithProviders(<TipNotDetectedBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Tip presence errors are usually caused by improperly placed labware or inaccurate labware offsets',
        message:
          ' If the issue persists, cancel the run and perform Labware Position Check',
      }),
      {}
    )
  })

  it('renders the InlineNotification for GripperErrorBanner', () => {
    renderWithProviders(<GripperErrorBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Gripper errors occur when the gripper stalls or collides with another object on the deck and are usually caused by improperly placed labware or inaccurate labware offsets',
        message:
          ' If the issue persists, cancel the run and rerun gripper calibration',
      }),
      {}
    )
  })

  it('renders the InlineNotification for StallErrorBanner', () => {
    renderWithProviders(<StallErrorBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          "A stall or collision is detected when the robot's motors are blocked",
        message: 'The robot must return to its home position before proceeding',
      }),
      {}
    )
  })
  it('renders the InlineNotification for NoLiquidDetectedBanner', () => {
    renderWithProviders(<NoLiquidDetectedBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Droplets or liquid in the tips may cause liquid level detection to fail',
        message: 'Use dry, unused tips for best results',
      }),
      {}
    )
  })

  it('renders the InlineNotification for StackerStallErrorBanner', () => {
    renderWithProviders(<StackerStallErrorBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading: `A stall or collision is detected when the robot's motors are blocked`,
        message: 'Clear obstructions before proceeding',
      }),
      {}
    )
  })

  it('renders the InlineNotification for LabwareMissingErrorBanner', () => {
    renderWithProviders(<LabwareMissingErrorBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Stacker empty errors occur when the robot tries to retrieve labware from an empty stacker',
        message:
          'Load the stacker with the correct labware to complete the stacker retrieve step.',
      }),
      {}
    )
  })

  it('renders the InlineNotification for LabwareMissingOnShuttleErrorBanner', () => {
    renderWithProviders(<LabwareMissingOnShuttleErrorBanner />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Stacker latch jammed errors occur when labware gets stuck in between the stacker latch. This is usually caused by improperly placed labware or inaccurate labware definitions',
        message:
          'If the issue persists, cancel the run and reach out to Opentrons support',
      }),
      {}
    )
  })
})
