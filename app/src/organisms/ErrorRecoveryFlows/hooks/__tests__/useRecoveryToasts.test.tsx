import { I18nextProvider } from 'react-i18next'
import { render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { i18n } from '/app/i18n'
import { useCommandTextString } from '/app/local-resources/commands'

import { useToaster } from '../../../ToasterOven'
import { RECOVERY_MAP } from '../../constants'
import {
  getStepNumber,
  handleRecoveryOptionAction,
  useRecoveryFullCommandText,
  useRecoveryToasts,
  useRecoveryToastText,
} from '../useRecoveryToasts'

import type { Mock } from 'vitest'
import type { ReactElement } from 'react'
import type { BuildToast } from '../useRecoveryToasts'

vi.mock('../../../ToasterOven')
vi.mock('/app/local-resources/commands')

const TEST_COMMAND = 'test command'
const TC_COMMAND =
  'tc starting profile of 1231231 element steps composed of some extra text bla bla'

let mockMakeToast: Mock

const DEFAULT_PROPS: BuildToast = {
  isOnDevice: false,
  stepCounts: {
    currentStepNumber: 1,
    hasRunDiverged: false,
    totalStepCount: 1,
  },
  selectedRecoveryOption: RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
  commandTextData: { commands: [] } as any,
  robotType: FLEX_ROBOT_TYPE,
  allRunDefs: [],
}

// Utility function for rendering with I18nextProvider
const renderWithI18n = (component: ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>)
}

describe('useRecoveryToasts', () => {
  beforeEach(() => {
    mockMakeToast = vi.fn()
    vi.mocked(useToaster).mockReturnValue({ makeToast: mockMakeToast } as any)
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: TEST_COMMAND,
    })
  })

  it('should return makeSuccessToast function', () => {
    const { result } = renderHook(() => useRecoveryToasts(DEFAULT_PROPS))

    expect(result.current.makeSuccessToast).toBeInstanceOf(Function)
  })

  it(`should not make toast for ${RECOVERY_MAP.CANCEL_RUN.ROUTE} option`, () => {
    const { result } = renderHook(() =>
      useRecoveryToasts({
        ...DEFAULT_PROPS,
        selectedRecoveryOption: RECOVERY_MAP.CANCEL_RUN.ROUTE,
      })
    )

    result.current.makeSuccessToast()
    expect(mockMakeToast).not.toHaveBeenCalled()
  })

  it('should make toast with correct parameters for desktop', () => {
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: TEST_COMMAND,
    })

    const { result } = renderHook(() =>
      useRecoveryToasts({
        ...DEFAULT_PROPS,
        commandTextData: { commands: [TEST_COMMAND] } as any,
      })
    )

    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: TEST_COMMAND,
    })

    result.current.makeSuccessToast()
    expect(mockMakeToast).toHaveBeenCalledWith(
      'test command',
      'success',
      expect.objectContaining({
        closeButton: true,
        disableTimeout: true,
        displayType: 'desktop',
        heading: 'Retrying step 1 succeeded.',
      })
    )
  })

  it('should make toast with correct parameters for ODD', () => {
    const { result } = renderHook(() =>
      useRecoveryToasts({
        ...DEFAULT_PROPS,
        isOnDevice: true,
      })
    )

    result.current.makeSuccessToast()
    expect(mockMakeToast).toHaveBeenCalledWith(
      expect.any(String),
      'success',
      expect.objectContaining({
        closeButton: true,
        disableTimeout: true,
        displayType: 'odd',
        heading: undefined,
      })
    )
  })

  it('should use recoveryToastText when desktopFullCommandText is null', () => {
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: '',
    })

    const { result } = renderHook(() =>
      useRecoveryToasts({
        ...DEFAULT_PROPS,
        commandTextData: { commands: [] } as any,
      })
    )

    result.current.makeSuccessToast()
    expect(mockMakeToast).toHaveBeenCalledWith(
      expect.any(String),
      'success',
      expect.objectContaining({
        closeButton: true,
        disableTimeout: true,
        displayType: 'desktop',
        heading: expect.any(String),
      })
    )
  })
})

describe('useRecoveryToastText', () => {
  it(`should return correct text for ${RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE} option`, () => {
    const { result } = renderHook(() =>
      useRecoveryToastText({
        stepNumber: 2,
        selectedRecoveryOption: RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
      })
    )

    renderWithI18n(<div>{result.current}</div>)
    screen.getByText('Retrying step 2 succeeded.')
  })

  it(`should return correct text for ${RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE} option`, () => {
    const { result } = renderHook(() =>
      useRecoveryToastText({
        stepNumber: 3,
        selectedRecoveryOption: RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE,
      })
    )

    renderWithI18n(<div>{result.current}</div>)
    screen.getByText('Skipping to step 3 succeeded.')
  })
})

describe('getStepNumber', () => {
  it(`should return current step for ${RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE} option`, () => {
    expect(getStepNumber(RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE, 3)).toBe(3)
  })

  it(`should return next step for ${RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE} option`, () => {
    expect(getStepNumber(RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE, 3)).toBe(
      4
    )
  })

  it('should handle a falsy currentStepCount', () => {
    expect(getStepNumber(RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE, null)).toBe(null)
  })

  it('should handle unknown recovery option', () => {
    expect(getStepNumber('UNKNOWN_OPTION' as any, 3)).toBeNull()
  })
})

describe('useRecoveryFullCommandText', () => {
  it('should return the correct command text', () => {
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: TEST_COMMAND,
    })

    const { result } = renderHook(() =>
      useRecoveryFullCommandText({
        robotType: FLEX_ROBOT_TYPE,
        stepNumber: 1,
        commandTextData: { commands: [TEST_COMMAND, {}] } as any,
        allRunDefs: [],
      })
    )

    expect(result.current).toBe(TEST_COMMAND)
  })

  it('should return null when relevantCmd is null', () => {
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: '',
    })

    const { result } = renderHook(() =>
      useRecoveryFullCommandText({
        robotType: FLEX_ROBOT_TYPE,
        stepNumber: 1,
        commandTextData: { commands: [] } as any,
        allRunDefs: [],
      })
    )

    expect(result.current).toBeNull()
  })

  it('should return null if there is no current step count', () => {
    const { result } = renderHook(() =>
      useRecoveryFullCommandText({
        robotType: FLEX_ROBOT_TYPE,
        stepNumber: null,
        commandTextData: { commands: [] } as any,
        allRunDefs: [],
      })
    )

    expect(result.current).toBeNull()
  })

  it('should truncate TC command', () => {
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'thermocycler/runProfile',
      commandText: TC_COMMAND,
      stepTexts: ['step'],
    })

    const { result } = renderHook(() =>
      useRecoveryFullCommandText({
        robotType: FLEX_ROBOT_TYPE,
        stepNumber: 1,
        commandTextData: {
          commands: [TC_COMMAND],
        } as any,
        allRunDefs: [],
      })
    )
    expect(result.current).toBe('tc starting profile of 1231231 element steps')
  })

  it('should truncate new TC command', () => {
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'thermocycler/runExtendedProfile',
      commandText: TC_COMMAND,
      profileElementTexts: [{ kind: 'step', stepText: 'blah blah blah' }],
    })

    const { result } = renderHook(() =>
      useRecoveryFullCommandText({
        robotType: FLEX_ROBOT_TYPE,
        stepNumber: 1,
        commandTextData: {
          commands: [TC_COMMAND, {}],
        } as any,
        allRunDefs: [],
      })
    )
    expect(result.current).toBe('tc starting profile of 1231231 element steps')
  })
})

describe('handleRecoveryOptionAction', () => {
  const CURRENT_STEP_VALUE = 'currentStepValue'
  const NEXT_STEP_VALUE = 'nextStepValue'

  // Routes that should return the nextStepReturnVal toasts.
  const NEXT_STEP_ROUTES = [
    RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE,
    RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE,
    RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
    RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
    RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
    RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
    RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
  ]

  // Routes that should return the currentStepReturnVal toasts.
  const CURRENT_STEP_ROUTES = [
    RECOVERY_MAP.CANCEL_RUN.ROUTE,
    RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
    RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
    RECOVERY_MAP.RETRY_STEP.ROUTE,
    RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
    RECOVERY_MAP.HOME_AND_RETRY.ROUTE,
    RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
    RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
    RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
    RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
    RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
    RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
  ]

  // Routes that should return no toasts.
  const NULL_ROUTES = [
    RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
    RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE,
    RECOVERY_MAP.ROBOT_CANCELING.ROUTE,
    RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
    RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE,
    RECOVERY_MAP.ROBOT_RELEASING_LABWARE.ROUTE,
    RECOVERY_MAP.ROBOT_RESUMING.ROUTE,
    RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE,
    RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE,
    RECOVERY_MAP.ROBOT_DOOR_OPEN.ROUTE,
    RECOVERY_MAP.ROBOT_DOOR_OPEN_SPECIAL.ROUTE,
    RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    RECOVERY_MAP.ROBOT_RELEASING_LABWARE_LATCH.ROUTE,
  ]

  it.each(NEXT_STEP_ROUTES)('should return nextStepReturnVal for %s', route => {
    const result = handleRecoveryOptionAction(
      route,
      CURRENT_STEP_VALUE,
      NEXT_STEP_VALUE
    )
    expect(result).toBe(NEXT_STEP_VALUE)
  })

  it.each(CURRENT_STEP_ROUTES)(
    'should return currentStepReturnVal for %s',
    route => {
      const result = handleRecoveryOptionAction(
        route,
        CURRENT_STEP_VALUE,
        NEXT_STEP_VALUE
      )
      expect(result).toBe(CURRENT_STEP_VALUE)
    }
  )

  it.each(NULL_ROUTES)('should return null for %s', route => {
    const result = handleRecoveryOptionAction(
      route,
      CURRENT_STEP_VALUE,
      NEXT_STEP_VALUE
    )
    expect(result).toBeNull()
  })

  it('should return null for unknown recovery options', () => {
    const result = handleRecoveryOptionAction(
      'UNKNOWN_OPTION' as any,
      CURRENT_STEP_VALUE,
      NEXT_STEP_VALUE
    )
    expect(result).toBeNull()
  })

  it('should ensure all routes are tested and there are no duplicated routes', () => {
    const allRoutes = Object.values(RECOVERY_MAP).map(item => item.ROUTE)

    const testedRoutes = [
      ...NEXT_STEP_ROUTES,
      ...CURRENT_STEP_ROUTES,
      ...NULL_ROUTES,
    ]

    const untestedRoutes = allRoutes.filter(
      route => !testedRoutes.includes(route)
    )

    if (untestedRoutes.length > 0) {
      throw new Error(`Untested routes: ${untestedRoutes.join(', ')}`)
    }

    const allTestedRoutesSet = new Set(testedRoutes)
    expect(allTestedRoutesSet.size).toBe(testedRoutes.length)
  })
})
