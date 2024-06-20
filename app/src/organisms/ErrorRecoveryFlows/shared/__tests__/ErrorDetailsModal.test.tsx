import * as React from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { screen, act, renderHook } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { InlineNotification } from '../../../../atoms/InlineNotification'
import { StepInfo } from '../StepInfo'
import { Modal } from '../../../../molecules/Modal'
import {
  useErrorDetailsModal,
  ErrorDetailsModal,
  ErrorDetailsModalODD,
  OverpressureBanner,
} from '../ErrorDetailsModal'

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: vi.fn((element, container) => element),
}))
vi.mock('../../../../molecules/Modal', () => ({
  Modal: vi.fn(({ children }) => <div>{children}</div>),
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

describe('ErrorDetailsModal', () => {
  let props: React.ComponentProps<typeof ErrorDetailsModal>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      toggleModal: vi.fn(),
      robotType: 'OT-3 Standard',
    }

    vi.mocked(StepInfo).mockReturnValue(<div>MOCK_STEP_INFO</div>)
  })

  it('renders ErrorDetailsModalODD', () => {
    renderWithProviders(<ErrorDetailsModal {...props} />, {
      i18nInstance: i18n,
    })
    expect(screen.getByText('MOCK_STEP_INFO')).toBeInTheDocument()
  })
})

const render = (props: React.ComponentProps<typeof ErrorDetailsModalODD>) => {
  return renderWithProviders(<ErrorDetailsModalODD {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorDetailsModalODD', () => {
  let props: React.ComponentProps<typeof ErrorDetailsModalODD>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      toggleModal: vi.fn(),
      robotType: 'OT-3 Standard',
    }

    vi.mocked(StepInfo).mockReturnValue(<div>MOCK_STEP_INFO</div>)
    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  it('renders the modal with the correct content', () => {
    render(props)
    expect(vi.mocked(Modal)).toHaveBeenCalledWith(
      expect.objectContaining({
        header: {
          title: 'Error',
          hasExitIcon: true,
        },
        onOutsideClick: props.toggleModal,
      }),
      {}
    )
    expect(screen.getByText('MOCK_STEP_INFO')).toBeInTheDocument()
  })

  it('renders the OverpressureBanner when the error kind is an overpressure error', () => {
    props.failedCommand = {
      ...props.failedCommand,
      error: { errorType: 'overpressure' },
    } as any
    render(props)

    screen.getByText('MOCK_INLINE_NOTIFICATION')
  })

  it('does not render the OverpressureBanner when the error kind is not an overpressure error', () => {
    render(props)

    expect(screen.queryByText('MOCK_INLINE_NOTIFICATION')).toBeNull()
  })
})

describe('OverpressureBanner', () => {
  beforeEach(() => {
    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  it('renders the InlineNotification', () => {
    renderWithProviders(<OverpressureBanner isOnDevice={true} />, {
      i18nInstance: i18n,
    })
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'Overpressure is usually caused by a tip contacting labware, a clog, or moving viscous liquid too quickly. If the issue persists, cancel the run and make the necessary changes to the protocol.',
      }),
      {}
    )
  })
})
