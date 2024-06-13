import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import {
  screen,
  fireEvent,
  renderHook,
  render as testingRender,
} from '@testing-library/react'

import { mockPipetteInfo } from '../../../../redux/pipettes/__fixtures__'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { ManageTips, useDropTipFlowUtils } from '../ManageTips'
import { RECOVERY_MAP } from '../../constants'
import { DropTipWizardFlows } from '../../../DropTipWizardFlows'

import type { Mock } from 'vitest'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

vi.mock('../../../DropTipWizardFlows')

const { DROP_TIP_FLOWS } = RECOVERY_MAP

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const render = (props: React.ComponentProps<typeof ManageTips>) => {
  return renderWithProviders(<ManageTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ManageTips', () => {
  let props: React.ComponentProps<typeof ManageTips>
  let mockProceedNextStep: Mock
  let mockSetRobotInMotion: Mock

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockSetRobotInMotion = vi.fn(() => Promise.resolve())

    props = {
      ...mockRecoveryContentProps,
      recoveryMap: {
        route: DROP_TIP_FLOWS.ROUTE,
        step: DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL,
      },
      tipStatusUtils: {
        pipettesWithTip: [{ mount: 'left', specs: MOCK_ACTUAL_PIPETTE }],
      } as any,
      routeUpdateActions: {
        proceedNextStep: mockProceedNextStep,
        setRobotInMotion: mockSetRobotInMotion,
      } as any,
      recoveryCommands: { cancelRun: vi.fn() } as any,
    }

    vi.mocked(DropTipWizardFlows).mockReturnValue(
      <div>MOCK DROP TIP FLOWS</div>
    )
  })

  it(`renders BeginRemoval with correct copy when the step is ${DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL}`, () => {
    render(props)

    screen.getByText(
      'You may want to remove the tips from the left pipette before using it again in a protocol'
    )
    screen.getByText('Begin removal')
    screen.getByText('Skip')
    screen.getByText('Continue')
  })

  it('routes correctly when continuing on BeginRemoval', () => {
    render(props)

    const beginRemovalBtn = screen.getByText('Begin removal')
    const skipBtn = screen.getByText('Skip')
    const continueBtn = screen.getByRole('button', { name: 'Continue' })

    fireEvent.click(beginRemovalBtn)
    fireEvent.click(continueBtn)

    expect(mockProceedNextStep).toHaveBeenCalled()

    fireEvent.click(skipBtn)
    fireEvent.click(continueBtn)

    expect(mockSetRobotInMotion).toHaveBeenCalled()
  })

  it(`renders the Drop Tip flows when the route is ${DROP_TIP_FLOWS.STEPS.WIZARD}`, () => {
    render({
      ...props,
      recoveryMap: { ...props.recoveryMap, step: DROP_TIP_FLOWS.STEPS.WIZARD },
    })

    screen.getByText('MOCK DROP TIP FLOWS')
  })
})

describe('useDropTipFlowUtils', () => {
  const mockRunId = 'MOCK_RUN_ID'
  const mockTipStatusUtils = { runId: mockRunId }

  const mockProps = {
    tipStatusUtils: mockTipStatusUtils,
    failedCommand: null,
    previousRoute: null,
    trackExternalMap: vi.fn(),
  } as any

  it('should return the correct runId', () => {
    const { result } = renderHook(() => useDropTipFlowUtils(mockProps))

    expect(result.current.runId).toBe(mockRunId)
  })

  it('should return an empty failedCommandId if failedCommand is null', () => {
    const { result } = renderHook(() => useDropTipFlowUtils(mockProps))

    expect(result.current.failedCommandId).toBe('')
  })

  it('should return the failedCommandId if failedCommand is provided', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils({
        ...mockProps,
        failedCommand: { id: 'MOCK_COMMAND_ID' },
      } as any)
    )

    expect(result.current.failedCommandId).toBe('MOCK_COMMAND_ID')
  })

  it('should return the correct copy overrides', () => {
    const { result } = renderHook(() => useDropTipFlowUtils(mockProps))

    testingRender(result.current.copyOverrides.beforeBeginningTopText as any)

    screen.getByText('First, do you need to preserve aspirated liquid?')

    testingRender(result.current.copyOverrides.tipDropCompleteBtnCopy as any)

    screen.getByText('Proceed to cancel')
  })

  it('should call trackExternalMap with the current map', () => {
    const mockTrackExternalMap = vi.fn()
    const { result } = renderHook(() =>
      useDropTipFlowUtils({
        ...mockProps,
        trackExternalMap: mockTrackExternalMap,
      })
    )

    const currentMap = { route: 'route', step: 'step' }
    result.current.trackCurrentMap(currentMap)

    expect(mockTrackExternalMap).toHaveBeenCalledWith(currentMap)
  })
})
