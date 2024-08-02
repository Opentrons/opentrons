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
import { DT_ROUTES } from '../../../DropTipWizardFlows/constants'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { clickButtonLabeled } from '../../__tests__/util'

import type { Mock } from 'vitest'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

vi.mock('../../../DropTipWizardFlows')
vi.mock('../SelectRecoveryOption')

const { DROP_TIP_FLOWS, RETRY_NEW_TIPS } = RECOVERY_MAP

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
  let mockProceedToRouteAndStep: Mock
  let mockSetRobotInMotion: Mock

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockProceedToRouteAndStep = vi.fn(() => Promise.resolve())
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
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
      recoveryCommands: { cancelRun: vi.fn() } as any,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: null,
      } as any,
      subMapUtils: { subMap: null, updateSubMap: vi.fn() },
    }

    vi.mocked(DropTipWizardFlows).mockReturnValue(
      <div>MOCK DROP TIP FLOWS</div>
    )

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK SELECT RECOVERY OPTION</div>
    )
  })

  it('renders SelectRecoveryOption when the route is unknown', () => {
    props = { ...props, recoveryMap: { ...props.recoveryMap, step: 'UNKNOWN' } }
    render(props)

    screen.getByText('MOCK SELECT RECOVERY OPTION')
  })

  it(`renders BeginRemoval with correct copy when the step is ${DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL}`, () => {
    render(props)

    screen.getByText('Remove any attached tips')
    screen.queryByText(
      /Homing the .* pipette with liquid in the tips may damage it\. You must remove all tips before using the pipette again\./
    )
    screen.queryAllByText('Begin removal')
    screen.queryAllByText('Skip')
  })

  it('routes correctly when continuing on BeginRemoval', () => {
    render(props)

    const beginRemovalBtn = screen.queryAllByText('Begin removal')[0]
    const skipBtn = screen.queryAllByText('Skip')[0]

    fireEvent.click(beginRemovalBtn)
    clickButtonLabeled('Begin removal')

    expect(mockProceedNextStep).toHaveBeenCalled()

    fireEvent.click(skipBtn)
    clickButtonLabeled('Skip')

    expect(mockSetRobotInMotion).toHaveBeenCalled()
  })

  it(`handles special routing for ${RETRY_NEW_TIPS.ROUTE} when skipping tip drop`, () => {
    props = {
      ...props,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RETRY_NEW_TIPS.ROUTE,
      } as any,
    }
    render(props)

    const skipBtn = screen.queryAllByText('Skip')[0]

    fireEvent.click(skipBtn)
    clickButtonLabeled('Skip')

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RETRY_NEW_TIPS.ROUTE,
      RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
    )
  })

  it(`renders the Drop Tip flows when the route is ${DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING,
      },
    })

    screen.getByText('MOCK DROP TIP FLOWS')
  })

  it(`renders the Drop Tip flows when the route is ${DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT,
      },
    })

    screen.getByText('MOCK DROP TIP FLOWS')
  })

  it(`renders the Drop Tip flows when the route is ${DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP,
      },
    })

    screen.getByText('MOCK DROP TIP FLOWS')
  })
})

describe('useDropTipFlowUtils', () => {
  const mockRunId = 'MOCK_RUN_ID'
  const mockTipStatusUtils = { runId: mockRunId }
  const mockProceedToRouteAndStep = vi.fn()
  const mockUpdateSubMap = vi.fn()
  const { ERROR_WHILE_RECOVERING, DROP_TIP_FLOWS } = RECOVERY_MAP

  const mockProps = {
    tipStatusUtils: mockTipStatusUtils,
    failedCommand: null,
    subMapUtils: {
      updateSubMap: mockUpdateSubMap,
      subMap: null,
    },
    currentRecoveryOptionUtils: {
      selectedRecoveryOption: null,
    } as any,
    routeUpdateActions: { proceedToRouteAndStep: mockProceedToRouteAndStep },
    recoveryMap: { step: DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP },
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

  it('should call updateSubMap with the current map', () => {
    const { result } = renderHook(() => useDropTipFlowUtils(mockProps))

    const currentMap = { route: 'route', step: 'step' } as any
    result.current.reportMap(currentMap)

    expect(mockUpdateSubMap).toHaveBeenCalledWith(currentMap)
  })

  it('should return the correct error overrides', () => {
    const { result } = renderHook(() => useDropTipFlowUtils(mockProps))

    result.current.errorOverrides.tipDropFailed()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      ERROR_WHILE_RECOVERING.ROUTE,
      ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED
    )

    result.current.errorOverrides.blowoutFailed()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      ERROR_WHILE_RECOVERING.ROUTE,
      ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED
    )

    result.current.errorOverrides.generalFailure()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      ERROR_WHILE_RECOVERING.ROUTE,
      ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR
    )
  })

  it('should return the correct button overrides', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils({
        ...mockProps,
        recoveryMap: {
          route: RETRY_NEW_TIPS.ROUTE,
          step: RETRY_NEW_TIPS.STEPS.DROP_TIPS,
        },
        currentRecoveryOptionUtils: {
          selectedRecoveryOption: RETRY_NEW_TIPS.ROUTE,
        } as any,
      })
    )
    const { tipDropComplete } = result.current.buttonOverrides

    result.current.buttonOverrides.goBackBeforeBeginning()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(DROP_TIP_FLOWS.ROUTE)

    expect(tipDropComplete).toBeDefined()

    if (tipDropComplete != null) {
      tipDropComplete()
    }

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RETRY_NEW_TIPS.ROUTE,
      RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
    )
  })

  it(`should return correct route override when the step is ${DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP}`, () => {
    const { result } = renderHook(() => useDropTipFlowUtils(mockProps))

    expect(result.current.routeOverride).toEqual({
      route: DT_ROUTES.DROP_TIP,
      step: null,
    })
  })

  it(`should return correct route override when the step is ${DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT}`, () => {
    const mockPropsBlowout = {
      ...mockProps,
      recoveryMap: { step: DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT },
    }
    const { result } = renderHook(() => useDropTipFlowUtils(mockPropsBlowout))

    expect(result.current.routeOverride).toEqual({
      route: DT_ROUTES.BLOWOUT,
      step: null,
    })
  })

  it('should use subMap.step in routeOverride if available', () => {
    const mockPropsWithSubMap = {
      ...mockProps,
      subMapUtils: {
        ...mockProps.subMapUtils,
        subMap: { route: DT_ROUTES.DROP_TIP, step: 'SOME_STEP' },
      },
    }
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockPropsWithSubMap)
    )

    expect(result.current.routeOverride).toEqual({
      route: DT_ROUTES.DROP_TIP,
      step: 'SOME_STEP',
    })
  })
})
