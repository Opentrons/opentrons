import { useSelector } from 'react-redux'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { MockLPCContentContainer } from '/app/organisms/LabwarePositionCheck/__fixtures__'
import { mockLPCContentProps } from '/app/organisms/LabwarePositionCheck/__fixtures__/mockLPCContentProps'
import { LPCDoorOpen } from '/app/organisms/LabwarePositionCheck/LPCDoorOpen'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof useSelector>()
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})

vi.mock('/app/organisms/LabwarePositionCheck/LPCContentContainer', () => ({
  LPCContentContainer: MockLPCContentContainer,
}))

const render = (props: ComponentProps<typeof LPCDoorOpen>) => {
  return renderWithProviders(<LPCDoorOpen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LPCDoorOpen', () => {
  let props: ComponentProps<typeof LPCDoorOpen>
  let mockDismissDoorOpenError: Mock
  let mockHandleCloseWithoutHome: Mock

  beforeEach(() => {
    mockDismissDoorOpenError = vi.fn()
    mockHandleCloseWithoutHome = vi.fn()

    props = {
      ...mockLPCContentProps,
      commandUtils: {
        ...mockLPCContentProps.commandUtils,
        dismissDoorOpenError: mockDismissDoorOpenError,
        headerCommands: {
          ...mockLPCContentProps.commandUtils.headerCommands,
          handleCloseWithoutHome: mockHandleCloseWithoutHome,
        },
      },
    }

    vi.mocked(useSelector).mockReturnValue({
      currentStepIndex: 1,
      totalStepCount: 5,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('passes correct header props to LPCContentContainer', () => {
    render(props)

    const header = screen.getByTestId('header-prop')
    expect(header).toHaveTextContent('Labware Position Check')

    const primaryButton = screen.getByTestId('primary-button')
    expect(primaryButton).toHaveAttribute('data-button-text', 'Try again')
    expect(primaryButton).toHaveAttribute('data-click-handler', 'true')

    const secondaryButton = screen.getByTestId('secondary-button')
    expect(secondaryButton).toHaveAttribute('data-text', 'Exit')

    fireEvent.click(primaryButton)

    expect(mockDismissDoorOpenError).toHaveBeenCalled()
  })

  it('renders appropriate body content', () => {
    render(props)

    screen.getByText('Robot door is open')
    screen.getByText('Close the door and try again.')
  })

  it('exits without homing when Exit is clicked', () => {
    render(props)

    const secondaryButton = screen.getByTestId('secondary-button')
    fireEvent.click(secondaryButton)

    expect(mockHandleCloseWithoutHome).toHaveBeenCalled()
  })
})
