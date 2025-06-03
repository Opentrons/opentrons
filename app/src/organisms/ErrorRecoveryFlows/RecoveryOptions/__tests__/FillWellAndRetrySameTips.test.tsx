import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InlineNotification } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'
import {
  FillWell,
  RetryWithSameTips,
} from '/app/organisms/ErrorRecoveryFlows/shared'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import { CancelRun } from '../CancelRun'
import {
  FillWellAndRetrySameTips,
  SkipToNextStep,
} from '../FillWellAndRetrySameTips'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('../CancelRun')
vi.mock('../SelectRecoveryOption')
vi.mock('/app/organisms/ErrorRecoveryFlows/shared/SelectRecoveryOption')
vi.mock('/app/organisms/ErrorRecoveryFlows/shared/FillWell')
vi.mock('/app/organisms/ErrorRecoveryFlows/shared/RetryWithSameTips')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InlineNotification>()
  return {
    ...actual,
    InlineNotification: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof FillWellAndRetrySameTips>) => {
  return renderWithProviders(<FillWellAndRetrySameTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderSkipToNextStep = (props: ComponentProps<typeof SkipToNextStep>) => {
  return renderWithProviders(<SkipToNextStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FillWellAndRetrySameTips', () => {
  let props: ComponentProps<typeof FillWellAndRetrySameTips>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(CancelRun).mockReturnValue(<div>MOCK_CANCEL_RUN</div>)
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(FillWell).mockReturnValue(<div>MOCK_FILL_WELL</div>)
    vi.mocked(RetryWithSameTips).mockReturnValue(
      <div>MOCK_RETRY_WITH_SAME_TIPS</div>
    )
  })

  it(`renders FillWell when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.MANUAL_FILL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.MANUAL_FILL,
      },
    }
    render(props)

    screen.getByText('MOCK_FILL_WELL')
  })

  it(`renders SkipToNextStep when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step:
          RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
      },
    }
    render(props)
    screen.getByText('MOCK_RETRY_WITH_SAME_TIPS')
  })

  it(`renders CancelRun when step is ${RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL,
      },
    }
    render(props)
    screen.getByText('MOCK_CANCEL_RUN')
  })

  it('renders SelectRecoveryOption as a fallback', () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: 'UNKNOWN_STEP' as any,
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})

describe('SkipToNextStep', () => {
  let props: ComponentProps<typeof SkipToNextStep>
  let mockhandleMotionRouting: Mock
  let mockGoBackPrevStep: Mock
  let mockProceedToRouteAndStep: Mock
  let mockSkipFailedCommand: Mock

  beforeEach(() => {
    mockhandleMotionRouting = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn()
    mockProceedToRouteAndStep = vi.fn()
    mockSkipFailedCommand = vi.fn(() => Promise.resolve())

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        handleMotionRouting: mockhandleMotionRouting,
        goBackPrevStep: mockGoBackPrevStep,
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
      recoveryCommands: {
        skipFailedCommand: mockSkipFailedCommand,
      } as any,
    }

    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  it(`calls proceedToRouteAndStep when selectedRecoveryOption is ${RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE} and secondary button is clicked`, () => {
    props = {
      ...props,
      currentRecoveryOptionUtils: {
        ...props.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
      },
    }
    renderSkipToNextStep(props)
    clickButtonLabeled('Go back')
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE
    )
  })

  it('calls goBackPrevStep when selectedRecoveryOption is not IGNORE_AND_SKIP and secondary button is clicked', () => {
    renderSkipToNextStep(props)
    clickButtonLabeled('Go back')
    expect(mockGoBackPrevStep).toHaveBeenCalled()
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    renderSkipToNextStep(props)
    clickButtonLabeled('Continue run now')
    await waitFor(() => {
      expect(mockhandleMotionRouting).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE
      )
    })
    await waitFor(() => {
      expect(mockSkipFailedCommand).toHaveBeenCalled()
    })

    expect(mockhandleMotionRouting.mock.invocationCallOrder[0]).toBeLessThan(
      mockSkipFailedCommand.mock.invocationCallOrder[0]
    )
  })

  it('renders the appropriate inline notification', () => {
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading:
          'If using static meniscus pipetting, liquid tracking may be less accurate when skipping liquid presence detection.',
      }),
      {}
    )
  })
})
