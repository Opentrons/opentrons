import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { StackerLoadShuttle } from '../StackerLoadShuttle'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

describe('Render StackerLoadShuttle', () => {
  let props: ComponentProps<typeof StackerLoadShuttle>
  let mockHandleMotionRouting: Mock
  let mockHomeShuttle: Mock
  let mockProceedNextStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockHomeShuttle = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn(() => Promise.resolve())

    props = {
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
      recoveryCommands: {
        homeShuttle: mockHomeShuttle,
      } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      } as any,
      stepCounts: { hasRunDiverged: false },
    } as any
  })

  const render = (props: ComponentProps<typeof StackerLoadShuttle>) => {
    return renderWithProviders(<StackerLoadShuttle {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it('calls proceedNextStep when primary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Continue')
    await waitFor(() => {
      expect(mockProceedNextStep).toHaveBeenCalled()
    })
  })

  it('calls goBackPrevStep when secondary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Go back')

    await waitFor(() => {
      expect(mockGoBackPrevStep).toHaveBeenCalled()
    })
  })

  it(`renders correct title`, () => {
    render(props)

    screen.getByText('Load labware shuttle onto track')
    screen.getByText(
      'Take any necessary precautions before loading the labware shuttle onto the track.'
    )
  })
})
