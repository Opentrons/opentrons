import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { SelectTips } from '../SelectTips'
import { RECOVERY_MAP } from '../../constants'
import { TipSelectionModal } from '../TipSelectionModal'

import type { Mock } from 'vitest'

vi.mock('../TipSelectionModal')
vi.mock('../TipSelection')
vi.mock('../LeftColumnTipInfo')

const render = (props: React.ComponentProps<typeof SelectTips>) => {
  return renderWithProviders(<SelectTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SelectTips', () => {
  let props: React.ComponentProps<typeof SelectTips>
  let mockGoBackPrevStep: Mock
  let mockSetRobotInMotion: Mock
  let mockProceedNextStep: Mock
  let mockPickUpTips: Mock

  beforeEach(() => {
    mockGoBackPrevStep = vi.fn()
    mockSetRobotInMotion = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn()
    mockPickUpTips = vi.fn(() => Promise.resolve())

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        goBackPrevStep: mockGoBackPrevStep,
        setRobotInMotion: mockSetRobotInMotion,
        proceedNextStep: mockProceedNextStep,
      } as any,
      recoveryCommands: {
        pickUpTips: mockPickUpTips,
      } as any,
      failedPipetteInfo: {
        data: {
          channels: 8,
        },
      } as any,
    }

    vi.mocked(TipSelectionModal).mockReturnValue(
      <div>MOCK TIP SELECTION MODAL</div>
    )
  })

  it('renders the TipSelectionModal when showTipSelectModal is true', () => {
    render(props)

    fireEvent.click(screen.getByText('Change location'))

    expect(screen.getByText('MOCK TIP SELECTION MODAL')).toBeInTheDocument()
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    const setRobotInMotionMock = vi.fn(() => Promise.resolve())
    const pickUpTipsMock = vi.fn(() => Promise.resolve())
    const proceedNextStepMock = vi.fn()

    const mockRecoveryCommands = {
      pickUpTips: pickUpTipsMock,
    } as any

    const mockRouteUpdateActions = {
      setRobotInMotion: setRobotInMotionMock,
      proceedNextStep: proceedNextStepMock,
    } as any

    render({
      ...props,
      recoveryCommands: mockRecoveryCommands,
      routeUpdateActions: mockRouteUpdateActions,
    })

    const primaryBtn = screen.getByText('Pick up tips')
    fireEvent.click(primaryBtn)

    await waitFor(() => {
      expect(setRobotInMotionMock).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(setRobotInMotionMock).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE
      )
    })
    await waitFor(() => {
      expect(pickUpTipsMock).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(proceedNextStepMock).toHaveBeenCalledTimes(1)
    })

    expect(setRobotInMotionMock.mock.invocationCallOrder[0]).toBeLessThan(
      pickUpTipsMock.mock.invocationCallOrder[0]
    )

    await waitFor(() => {
      expect(pickUpTipsMock.mock.invocationCallOrder[0]).toBeLessThan(
        proceedNextStepMock.mock.invocationCallOrder[0]
      )
    })
  })

  it('calls goBackPrevStep when the secondary button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Go back'))

    expect(mockGoBackPrevStep).toHaveBeenCalled()
  })

  it('disables the tertiary button when the pipette has 96 channels', () => {
    props = {
      ...props,
      failedPipetteInfo: {
        data: {
          channels: 96,
        },
      } as any,
    }
    render(props)

    const tertiaryBtn = screen.getByRole('button', { name: 'Change location' })
    expect(tertiaryBtn).toBeDisabled()
  })
})
