import { fireEvent, screen } from '@testing-library/react'

import '@testing-library/jest-dom/vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAcknowledgeEstopDisengageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { getIsOnDevice } from '/app/redux/config'
import { usePlacePlateReaderLid } from '/app/resources/modules'

import { EstopPressedModal } from '../EstopPressedModal'

import type { ComponentProps } from 'react'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/config')
vi.mock('/app/resources/modules')

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = (props: ComponentProps<typeof EstopPressedModal>) => {
  return renderWithProviders(<EstopPressedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopPressedModal - Touchscreen', () => {
  let props: ComponentProps<typeof EstopPressedModal>
  const mockAcknowledgeEstopDisengage = vi.fn()

  beforeEach(() => {
    props = {
      isEngaged: true,
      closeModal: vi.fn(),
      isWaitingForResumeOperation: false,
      setIsWaitingForResumeOperation: vi.fn(),
    }
    vi.mocked(getIsOnDevice).mockReturnValue(true)
    mockAcknowledgeEstopDisengage.mockReset()
    vi.mocked(useAcknowledgeEstopDisengageMutation).mockReturnValue({
      acknowledgeEstopDisengage: mockAcknowledgeEstopDisengage,
    } as any)

    vi.mocked(usePlacePlateReaderLid).mockReturnValue({
      handlePlaceReaderLid: vi.fn(),
      isValidPlateReaderMove: false,
      isExecuting: false,
    })
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('E-stop pressed')
    screen.getByText('E-stop')
    screen.getByText('Engaged')
    screen.getByText(
      'First, safely clear the deck of any labware or spills. Then, twist the E-stop button clockwise. Finally, have Flex move the gantry to its home position.'
    )
    screen.getByText('Resume robot operations')
    expect(screen.getByTestId('Estop_pressed_button')).toBeDisabled()
  })

  it('should resume robot operation button is not disabled', () => {
    props.isEngaged = false
    render(props)
    screen.getByText('E-stop')
    screen.getByText('Disengaged')
    screen.getByText('Resume robot operations')
    expect(screen.getByTestId('Estop_pressed_button')).not.toBeDisabled()
  })

  it('should call a mock function when clicking resume robot operations', () => {
    props.isEngaged = false
    render(props)
    fireEvent.click(screen.getByText('Resume robot operations'))
    expect(useAcknowledgeEstopDisengageMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    expect(mockAcknowledgeEstopDisengage).toHaveBeenCalled()
  })

  it('should call a mock function to place the labware to a slot', () => {
    props.isEngaged = false
    const handlePlaceReaderLid = vi.fn()
    vi.mocked(usePlacePlateReaderLid).mockReturnValue({
      handlePlaceReaderLid,
      isValidPlateReaderMove: true,
      isExecuting: true,
    })
    mockAcknowledgeEstopDisengage.mockImplementation((_vars, options) => {
      options?.onSuccess?.({} as any, undefined, undefined)
    })

    render(props)
    fireEvent.click(screen.getByText('Resume robot operations'))
    expect(useAcknowledgeEstopDisengageMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    expect(handlePlaceReaderLid).toHaveBeenCalled()
  })
})

describe('EstopPressedModal - Desktop', () => {
  let props: ComponentProps<typeof EstopPressedModal>
  const mockAcknowledgeEstopDisengage = vi.fn()

  beforeEach(() => {
    props = {
      isEngaged: true,
      closeModal: vi.fn(),
      isWaitingForResumeOperation: false,
      setIsWaitingForResumeOperation: vi.fn(),
    }
    vi.mocked(getIsOnDevice).mockReturnValue(false)
    mockAcknowledgeEstopDisengage.mockReset()
    vi.mocked(useAcknowledgeEstopDisengageMutation).mockReturnValue({
      acknowledgeEstopDisengage: mockAcknowledgeEstopDisengage,
    } as any)

    vi.mocked(usePlacePlateReaderLid).mockReturnValue({
      handlePlaceReaderLid: vi.fn(),
      isValidPlateReaderMove: false,
      isExecuting: false,
    })
  })
  it('should render text and button', () => {
    render(props)
    screen.getByText('E-stop pressed')
    screen.getByText('E-stop Engaged')
    screen.getByText(
      'First, safely clear the deck of any labware or spills. Then, twist the E-stop button clockwise. Finally, have Flex move the gantry to its home position.'
    )
    expect(
      screen.getByRole('button', { name: 'Resume robot operations' })
    ).toBeDisabled()
  })

  it('should resume robot operation button is not disabled', () => {
    props.isEngaged = false
    render(props)
    expect(
      screen.getByRole('button', { name: 'Resume robot operations' })
    ).not.toBeDisabled()
  })

  it('should resume robot operation button is disabled when waiting for labware plate to finish', () => {
    props.isEngaged = false
    props.isWaitingForResumeOperation = true
    render(props)
    expect(
      screen.getByRole('button', { name: 'Resume robot operations' })
    ).toBeDisabled()
  })

  it('should call a mock function when clicking close icon', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ModalHeader_icon_close_E-stop pressed'))
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('should call a mock function when clicking resume robot operations', () => {
    props.isEngaged = false
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Resume robot operations' })
    )
    expect(useAcknowledgeEstopDisengageMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    expect(mockAcknowledgeEstopDisengage).toHaveBeenCalled()
  })
})
