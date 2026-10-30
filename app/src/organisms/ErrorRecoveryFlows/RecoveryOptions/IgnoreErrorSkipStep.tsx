import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  ERROR_KINDS,
  ODD_SECTION_TITLE_STYLE,
  RECOVERY_MAP,
} from '../constants'
import {
  RecoveryFooterButtons,
  RecoveryRadioGroup,
  RecoverySingleColumnContentWrapper,
  SkipStepInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ChangeEvent, ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function IgnoreErrorSkipStep(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { IGNORE_AND_SKIP } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case IGNORE_AND_SKIP.STEPS.SELECT_IGNORE_KIND:
        return <IgnoreErrorStepHome {...props} />
      case IGNORE_AND_SKIP.STEPS.SKIP_STEP:
        return <SkipStepInfo {...props} />
      default:
        console.warn(
          `IgnoreErrorAndSkipStep: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

export function IgnoreErrorStepHome({
  recoveryCommands,
  routeUpdateActions,
  errorKind,
  isOnDevice,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { ignoreErrorKindThisRun } = recoveryCommands
  const { proceedNextStep, proceedToRouteAndStep, goBackPrevStep } =
    routeUpdateActions

  const [selectedOption, setSelectedOption] = useState<IgnoreOption>(
    head(IGNORE_OPTIONS_IN_ORDER)!
  )

  // Reset client choice to ignore all errors whenever navigating back to this view. This prevents unexpected
  // behavior after pressing "go back" and ending up on this screen.
  useEffect(
    () => {
      void ignoreErrorKindThisRun(false)
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // In order to keep routing linear, all extended "skip" flows should be kept as separate recovery options with
  // go back functionality that routes to this view. Those "skip" views encapsulate the generic "skip" view.
  // See the "manually fill well and skip" recovery option for an example.
  const ignoreOnce = (): void => {
    switch (errorKind) {
      case ERROR_KINDS.NO_LIQUID_DETECTED:
        void proceedToRouteAndStep(
          RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
          RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.SKIP
        )
        break
      default:
        void proceedNextStep()
    }
  }

  // See ignoreOnce comment.
  const ignoreAlways = (): void => {
    void ignoreErrorKindThisRun(true).then(() => {
      switch (errorKind) {
        case ERROR_KINDS.NO_LIQUID_DETECTED:
          void proceedToRouteAndStep(
            RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
            RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.SKIP
          )
          break
        default:
          void proceedNextStep()
      }
    })
  }

  const primaryOnClick = (): void => {
    if (selectedOption === 'ignore_only_this_error') {
      ignoreOnce()
    } else if (selectedOption === 'ignore_all_errors_of_this_type') {
      ignoreAlways()
    } else {
      console.warn(`${selectedOption} not explictly handled.`)
    }
  }

  return (
    <RecoverySingleColumnContentWrapper css={DESKTOP_ONLY_GRID_GAP}>
      <StyledText
        css={ODD_SECTION_TITLE_STYLE}
        oddStyle="level4HeaderSemiBold"
        desktopStyle="headingSmallSemiBold"
      >
        {t('ignore_similar_errors_later_in_run')}
      </StyledText>
      {isOnDevice ? (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <IgnoreOptions
            ignoreOptions={IGNORE_OPTIONS_IN_ORDER}
            setSelectedOption={setSelectedOption}
            selectedOption={selectedOption}
          />
        </Flex>
      ) : (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RecoveryRadioGroup
            value={selectedOption}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSelectedOption(e.currentTarget.value as IgnoreOption)
            }}
            options={IGNORE_OPTIONS_IN_ORDER.map(option => {
              return {
                value: option,
                children: (
                  <StyledText
                    css={RADIO_GROUP_MARGIN}
                    desktopStyle="bodyDefaultRegular"
                  >
                    {t(option)}
                  </StyledText>
                ),
              }
            })}
          />
        </Flex>
      )}
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

interface IgnoreOptionsProps {
  ignoreOptions: IgnoreOption[]
  setSelectedOption: (ignoreOption: IgnoreOption) => void
  selectedOption?: IgnoreOption
}

// For ODD use only.
export function IgnoreOptions({
  setSelectedOption,
  ignoreOptions,
  selectedOption,
}: IgnoreOptionsProps): JSX.Element[] {
  const { t } = useTranslation('error_recovery')

  return ignoreOptions.map(ignoreOption => {
    const copyText = t(ignoreOption)

    return (
      <RadioButton
        key={`ignore_option_${ignoreOption}`}
        buttonLabel={copyText}
        buttonValue={copyText}
        onChange={() => {
          setSelectedOption(ignoreOption)
        }}
        isSelected={ignoreOption === selectedOption}
      />
    )
  })
}

type IgnoreOption = 'ignore_only_this_error' | 'ignore_all_errors_of_this_type'

const IGNORE_OPTIONS_IN_ORDER: IgnoreOption[] = [
  'ignore_only_this_error',
  'ignore_all_errors_of_this_type',
]

const RADIO_GROUP_MARGIN = css`
  @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    margin-left: 0.5rem;
  }
`

const DESKTOP_ONLY_GRID_GAP = css`
  @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    gap: 0rem;
  }
`
