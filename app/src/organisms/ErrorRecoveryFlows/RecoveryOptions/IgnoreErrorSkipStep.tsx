import * as React from 'react'
import head from 'lodash/head'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { ODD_SECTION_TITLE_STYLE, RECOVERY_MAP } from '../constants'
import { SelectRecoveryOption } from './SelectRecoveryOption'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'
import { RadioButton } from '../../../atoms/buttons'

import type { RecoveryContentProps } from '../types'

export function IgnoreErrorSkipStep(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { IGNORE_AND_SKIP } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case IGNORE_AND_SKIP.STEPS.SELECT_IGNORE_KIND:
        return <IgnoreErrorStepHome {...props} />
      default:
        console.warn(`${step} in ${route} not explicitly handled. Rerouting.`)
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

export function IgnoreErrorStepHome({
  isOnDevice,
  recoveryCommands,
  routeUpdateActions,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { FILL_MANUALLY_AND_SKIP } = RECOVERY_MAP
  const { ignoreErrorKindThisRun } = recoveryCommands
  const { proceedToRouteAndStep, goBackPrevStep } = routeUpdateActions

  const [selectedOption, setSelectedOption] = React.useState<IgnoreOption>(
    head(IGNORE_OPTIONS_IN_ORDER) as IgnoreOption
  )

  // It's safe to hard code the routing here, since only one route currently
  // utilizes ignoring. In the future, we may have to check the selectedRecoveryOption
  // and route appropriately.
  const ignoreOnce = (): void => {
    void proceedToRouteAndStep(
      FILL_MANUALLY_AND_SKIP.ROUTE,
      FILL_MANUALLY_AND_SKIP.STEPS.SKIP
    )
  }

  // See ignoreOnce comment.
  const ignoreAlways = (): void => {
    void ignoreErrorKindThisRun().then(() =>
      proceedToRouteAndStep(
        FILL_MANUALLY_AND_SKIP.ROUTE,
        FILL_MANUALLY_AND_SKIP.STEPS.SKIP
      )
    )
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

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <LegacyStyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
          {t('ignore_similar_errors_later_in_run')}
        </LegacyStyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <IgnoreOptions
            ignoreOptions={IGNORE_OPTIONS_IN_ORDER}
            setSelectedOption={setSelectedOption}
            selectedOption={selectedOption}
          />
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryOnClick}
          secondaryBtnOnClick={goBackPrevStep}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
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
