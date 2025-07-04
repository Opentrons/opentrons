import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { ERROR_KINDS, RECOVERY_MAP } from '../../constants'
import { LeftColumnLabwareInfo } from '../LeftColumnLabwareInfo'
import { StackerHopperLwInfo } from '../StackerHopperLwInfo'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('../LeftColumnLabwareInfo')

describe('Render StackerHopperLwInfo', () => {
  let props: ComponentProps<typeof StackerHopperLwInfo>
  let mockHandleMotionRouting: Mock
  let mockSkipFailedCommand: Mock
  let mockProceedNextStep: Mock
  let mockGoBackPrevStep: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())
    mockSkipFailedCommand = vi.fn(() => Promise.resolve())
    mockProceedNextStep = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn(() => Promise.resolve())

    props = {
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      } as any,
      recoveryCommands: {
        skipFailedCommand: mockSkipFailedCommand,
      } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      } as any,
      stepCounts: { hasRunDiverged: false },
      failedLabwareUtils: {
        labwareQuantity: 2,
      } as any,
      errorKind: ERROR_KINDS.STACKER_HOPPER_EMPTY,
    } as any

    vi.mocked(LeftColumnLabwareInfo).mockReturnValue(
      <div>MOCK_LEFT_COLUMN_LABWARE_INFO</div>
    )
  })

  const render = (props: ComponentProps<typeof StackerHopperLwInfo>) => {
    return renderWithProviders(<StackerHopperLwInfo {...props} />, {
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
        title: 'Load 2 labware into stacker',
      }),
      expect.anything()
    )
    screen.getByText('MOCK_LEFT_COLUMN_LABWARE_INFO')
  })

  it(`renders correct title for other error kinds`, () => {
    props.errorKind = ERROR_KINDS.STACKER_SHUTTLE_EMPTY
    render(props)

    expect(LeftColumnLabwareInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ensure stacker has labware',
      }),
      expect.anything()
    )
    screen.getByText('MOCK_LEFT_COLUMN_LABWARE_INFO')
  })
})
