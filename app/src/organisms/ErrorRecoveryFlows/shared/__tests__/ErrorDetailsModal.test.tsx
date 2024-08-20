import * as React from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { screen, act, renderHook } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { InlineNotification } from '../../../../atoms/InlineNotification'
import { StepInfo } from '../StepInfo'
import { OddModal } from '../../../../molecules/OddModal'
import {
  useErrorDetailsModal,
  ErrorDetailsModal,
  OverpressureBanner,
} from '../ErrorDetailsModal'

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: vi.fn((element, container) => element),
}))
vi.mock('../../../../molecules/OddModal', () => ({
  OddModal: vi.fn(({ children }) => <div>{children}</div>),
}))

vi.mock('../../../../atoms/InlineNotification')
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

const render = (props: React.ComponentProps<typeof ErrorDetailsModal>) => {
  return renderWithProviders(<ErrorDetailsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorDetailsModal', () => {
  let props: React.ComponentProps<typeof ErrorDetailsModal>

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
    it('renders the OverpressureBanner when the error kind is an overpressure error', () => {
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

    it('does not render the OverpressureBanner when the error kind is not an overpressure error', () => {
      render({ ...props, isOnDevice })

      expect(screen.queryByText('MOCK_INLINE_NOTIFICATION')).toBeNull()
    })
  })
})

describe('OverpressureBanner', () => {
  beforeEach(() => {
    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  it('renders the InlineNotification', () => {
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
})
