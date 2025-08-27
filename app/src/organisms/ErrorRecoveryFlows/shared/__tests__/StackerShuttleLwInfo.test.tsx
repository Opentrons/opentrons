import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { LeftColumnLabwareInfo } from '../LeftColumnLabwareInfo'
import { StackerShuttleLwInfo } from '../StackerShuttleLwInfo'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('../LeftColumnLabwareInfo')

describe('Render StackerShuttleLwInfo', () => {
  let props: ComponentProps<typeof StackerShuttleLwInfo>
  let mockHandleMotionRouting: Mock
  let mockManualRetrieve: Mock
  let mockProceedNextStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockManualRetrieve = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn(() => Promise.resolve())

    props = {
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
      recoveryCommands: {
        manualRetrieve: mockManualRetrieve,
      } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
      } as any,
      stepCounts: { hasRunDiverged: false },
    } as any

    vi.mocked(LeftColumnLabwareInfo).mockReturnValue(
      <div>MOCK_LEFT_COLUMN_LABWARE_INFO</div>
    )
  })

  const render = (props: ComponentProps<typeof StackerShuttleLwInfo>) => {
    return renderWithProviders(<StackerShuttleLwInfo {...props} />, {
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

    expect(LeftColumnLabwareInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Load labware onto labware shuttle',
        type: 'location',
        layout: 'default',
        showQuantity: false,
      }),
      expect.anything()
    )
    screen.getByText('MOCK_LEFT_COLUMN_LABWARE_INFO')
  })
})
