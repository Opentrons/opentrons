import {
  fireEvent,
  renderHook,
  screen,
  render as testingRender,
  waitFor,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { DropTipWizardFlows } from '/app/organisms/DropTipWizardFlows'
import { DT_ROUTES } from '/app/organisms/DropTipWizardFlows/constants'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { clickButtonLabeled } from '../../__tests__/util'
import { RECOVERY_MAP } from '../../constants'
import { ManageTips, useDropTipFlowUtils } from '../ManageTips'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

vi.mock('/app/organisms/DropTipWizardFlows')
vi.mock('../SelectRecoveryOption')

const { DROP_TIP_FLOWS, RETRY_NEW_TIPS, MANUAL_FILL_AND_RETRY_NEW_TIPS } =
  RECOVERY_MAP

const MOCK_ACTUAL_PIPETTE = {
  ...fixtureP10Single,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const render = (props: ComponentProps<typeof ManageTips>) => {
  return renderWithProviders(<ManageTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ManageTips', () => {
  let props: ComponentProps<typeof ManageTips>
  let mockProceedNextStep: Mock
  let mockProceedToRouteAndStep: Mock
  let mockhandleMotionRouting: Mock

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockProceedToRouteAndStep = vi.fn(() => Promise.resolve())
    mockhandleMotionRouting = vi.fn(() => Promise.resolve())

    props = {
      ...mockRecoveryContentProps,
      recoveryMap: {
        route: DROP_TIP_FLOWS.ROUTE,
        step: DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL,
      },
      tipStatusUtils: {
        runId: 'MOCK_RUN_ID',
        aPipetteWithTip: { mount: 'left', specs: MOCK_ACTUAL_PIPETTE },
        determineTipStatus: vi.fn(() => Promise.resolve([])),
        skipCurrentPipette: vi.fn(),
      } as any,
      routeUpdateActions: {
        proceedNextStep: mockProceedNextStep,
        handleMotionRouting: mockhandleMotionRouting,
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
    props = {
      ...props,
      recoveryMap: { ...props.recoveryMap, step: 'UNKNOWN' as any },
    }
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
    screen.queryAllByText('Skip and home pipette')
  })

  it('routes correctly when continuing on BeginRemoval', async () => {
    render(props)

    const beginRemovalBtn = screen.queryAllByText('Begin removal')[0]
    const skipBtn = screen.queryAllByText('Skip and home pipette')[0]

    fireEvent.click(beginRemovalBtn)
    clickButtonLabeled('Begin removal')

    expect(mockProceedNextStep).toHaveBeenCalled()

    fireEvent.click(skipBtn)
    clickButtonLabeled('Skip and home pipette')

    await waitFor(() => {
      expect(mockhandleMotionRouting).toHaveBeenCalled()
    })
    expect(props.tipStatusUtils.skipCurrentPipette).toHaveBeenCalled()
  })

  it(`handles special routing for ${RETRY_NEW_TIPS.ROUTE} when skipping tip drop`, async () => {
    props = {
      ...props,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RETRY_NEW_TIPS.ROUTE,
      } as any,
    }
    render(props)

    const skipBtn = screen.queryAllByText('Skip and home pipette')[0]

    fireEvent.click(skipBtn)
    clickButtonLabeled('Skip and home pipette')

    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RETRY_NEW_TIPS.ROUTE,
        RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })
  })

  it(`handles special routing for ${MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE} when skipping tip drop`, async () => {
    props = {
      ...props,
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
      } as any,
    }
    render(props)

    const skipBtn = screen.queryAllByText('Skip and home pipette')[0]

    fireEvent.click(skipBtn)
    clickButtonLabeled('Skip and home pipette')

    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
        MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })
  })

  it('offers the next pipette when skip still leaves another tip attached', async () => {
    props.tipStatusUtils.determineTipStatus = vi.fn(() =>
      Promise.resolve([{ mount: 'right' as const, specs: MOCK_ACTUAL_PIPETTE }])
    )
    render(props)

    clickButtonLabeled('Skip and home pipette')

    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        DROP_TIP_FLOWS.ROUTE,
        DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL
      )
    })
    expect(mockhandleMotionRouting).not.toHaveBeenCalled()
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

  describe('routeAlternativelyIfNoPipette', () => {
    it('should route to RETRY_NEW_TIPS.STEPS.REPLACE_TIPS when selectedRecoveryOption is RETRY_NEW_TIPS.ROUTE and no pipette with tip', () => {
      props.tipStatusUtils.aPipetteWithTip = null
      props.currentRecoveryOptionUtils.selectedRecoveryOption =
        RETRY_NEW_TIPS.ROUTE

      render(props)

      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RETRY_NEW_TIPS.ROUTE,
        RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })

    it('should route to SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS when selectedRecoveryOption is SKIP_STEP_WITH_NEW_TIPS.ROUTE and no pipette with tip', () => {
      props.tipStatusUtils.aPipetteWithTip = null
      props.currentRecoveryOptionUtils.selectedRecoveryOption =
        RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE

      render(props)

      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE,
        RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })

    it('should route to MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS when selectedRecoveryOption is MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE and no pipette with tip', () => {
      props.tipStatusUtils.aPipetteWithTip = null
      props.currentRecoveryOptionUtils.selectedRecoveryOption =
        RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE

      render(props)

      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
        RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })

    it('should route to OPTION_SELECTION.ROUTE when selectedRecoveryOption is not handled specifically and no pipette with tip', () => {
      props.tipStatusUtils.aPipetteWithTip = null
      props.currentRecoveryOptionUtils.selectedRecoveryOption =
        RECOVERY_MAP.CANCEL_RUN.ROUTE

      render(props)

      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RECOVERY_MAP.OPTION_SELECTION.ROUTE
      )
    })

    it('should not route alternatively when there is a pipette with tip', () => {
      props.tipStatusUtils.aPipetteWithTip = {
        mount: 'left',
        specs: MOCK_ACTUAL_PIPETTE,
      }
      props.currentRecoveryOptionUtils.selectedRecoveryOption =
        RETRY_NEW_TIPS.ROUTE

      render(props)

      expect(mockProceedToRouteAndStep).not.toHaveBeenCalled()
    })
  })
})

describe('useDropTipFlowUtils', () => {
  const mockRunId = 'MOCK_RUN_ID'
  const mockDispatch = vi.fn()
  const mockDetermineTipStatus = vi.fn(() => Promise.resolve([]))
  const mockTipStatusUtils = {
    runId: mockRunId,
    determineTipStatus: mockDetermineTipStatus,
    skipCurrentPipette: vi.fn(),
  }
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
    routeUpdateActions: {
      proceedToRouteAndStep: mockProceedToRouteAndStep,
      handleMotionRouting: vi.fn(() => Promise.resolve()),
    },
    recoveryCommands: { cancelRun: vi.fn() },
    recoveryMap: { step: DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP },
  } as any

  const renderUtils = (props = mockProps) =>
    renderHook(() => useDropTipFlowUtils(props, mockDispatch))

  it('should return the correct runId', () => {
    const { result } = renderUtils()

    expect(result.current.runId).toBe(mockRunId)
  })

  it('should return an empty failedCommandId if failedCommand is null', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockProps, mockDispatch)
    )

    expect(result.current.failedCommandId).toBe('')
  })

  it('should return the failedCommandId if failedCommand is provided', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(
        {
          ...mockProps,
          failedCommand: {
            byRunRecord: {
              id: 'MOCK_COMMAND_ID',
            },
          },
        } as any,
        mockDispatch
      )
    )

    expect(result.current.failedCommandId).toBe('MOCK_COMMAND_ID')
  })

  it('should return the correct copy overrides', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockProps, mockDispatch)
    )

    testingRender(result.current.copyOverrides.beforeBeginningTopText as any)

    screen.getByText('First, do you need to blow out aspirated liquid?')

    testingRender(result.current.copyOverrides.tipDropCompleteBtnCopy as any)

    screen.getByText('Proceed to cancel')
  })

  it('should return "Proceed to tip selection" button for MANUAL_FILL_AND_RETRY_NEW_TIPS route', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(
        {
          ...mockProps,
          currentRecoveryOptionUtils: {
            selectedRecoveryOption: MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
          },
        },
        mockDispatch
      )
    )

    testingRender(result.current.copyOverrides.tipDropCompleteBtnCopy as any)

    screen.getByText('Proceed to tip selection')
  })

  it('should call updateSubMap with the current map', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockProps, mockDispatch)
    )

    const currentMap = { route: 'route', step: 'step' } as any
    result.current.reportMap(currentMap)

    expect(mockUpdateSubMap).toHaveBeenCalledWith(currentMap)
  })

  it('should route to begin removal when documentation is cancelled with no selected option', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockProps, mockDispatch)
    )

    result.current.onDocumentationCancel?.()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      DROP_TIP_FLOWS.ROUTE,
      DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL
    )
  })

  it('should route to confirm cancel when documentation is cancelled during cancel run', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(
        {
          ...mockProps,
          currentRecoveryOptionUtils: {
            selectedRecoveryOption: RECOVERY_MAP.CANCEL_RUN.ROUTE,
          },
        } as any,
        mockDispatch
      )
    )

    result.current.onDocumentationCancel?.()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.CANCEL_RUN.ROUTE,
      RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL
    )
  })

  it('should return the correct error overrides', () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockProps, mockDispatch)
    )

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

  it('should return the correct button overrides for RETRY_NEW_TIPS route', async () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(
        {
          ...mockProps,
          recoveryMap: {
            route: RETRY_NEW_TIPS.ROUTE,
            step: RETRY_NEW_TIPS.STEPS.DROP_TIPS,
          },
          currentRecoveryOptionUtils: {
            selectedRecoveryOption: RETRY_NEW_TIPS.ROUTE,
          } as any,
        },
        mockDispatch
      )
    )
    const { tipDropComplete } = result.current.buttonOverrides

    result.current.buttonOverrides.goBackBeforeBeginning()

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(DROP_TIP_FLOWS.ROUTE)

    expect(tipDropComplete).toBeDefined()

    if (tipDropComplete != null) {
      tipDropComplete()
    }

    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        RETRY_NEW_TIPS.ROUTE,
        RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })
    expect(mockDispatch).toHaveBeenCalled()
  })

  it('should return the correct button overrides for MANUAL_FILL_AND_RETRY_NEW_TIPS route', async () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(
        {
          ...mockProps,
          recoveryMap: {
            route: MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
            step: MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.DROP_TIPS,
          },
          currentRecoveryOptionUtils: {
            selectedRecoveryOption: MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
          } as any,
        },
        mockDispatch
      )
    )
    const { tipDropComplete } = result.current.buttonOverrides

    expect(tipDropComplete).toBeDefined()

    if (tipDropComplete != null) {
      tipDropComplete()
    }

    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
        MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    })
  })

  it(`should return correct route override when the step is ${DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP}`, () => {
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockProps, mockDispatch)
    )

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
    const { result } = renderHook(() =>
      useDropTipFlowUtils(mockPropsBlowout, mockDispatch)
    )

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
      useDropTipFlowUtils(mockPropsWithSubMap, mockDispatch)
    )

    expect(result.current.routeOverride).toEqual({
      route: DT_ROUTES.DROP_TIP,
      step: 'SOME_STEP',
    })
  })
})
