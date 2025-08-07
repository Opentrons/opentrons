import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
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
  RecoverySingleColumnContentWrapper,
} from '../shared'
import {
  getRecoveryOptions,
  RecoveryOptions,
  SelectRecoveryOption,
} from './SelectRecoveryOption'

import type { RecoveryContentProps, RecoveryRoute } from '../types'

type StackerErrorFlow =
  | typeof ERROR_KINDS.STACKER_HOPPER_EMPTY
  | typeof ERROR_KINDS.STACKER_SHUTTLE_EMPTY

const { STACKER_HOPPER_OR_SHUTTLE_EMPTY } = RECOVERY_MAP

export function StackerSelectErrorFlow(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap

  switch (step) {
    case STACKER_HOPPER_OR_SHUTTLE_EMPTY.STEPS.SELECT_FLOW:
      return <StackerOptions {...props} />
    default:
      console.warn(
        `StackerSelectErrorFlow: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}

export function StackerOptions(props: RecoveryContentProps): JSX.Element {
  const {
    routeUpdateActions,
    getRecoveryOptionCopy,
    isOnDevice,
    currentRecoveryOptionUtils,
  } = props
  const { proceedToRouteAndStep } = routeUpdateActions
  const { setSelectedRecoveryOption } = currentRecoveryOptionUtils
  const { t } = useTranslation('error_recovery')

  const [showErrorOptions, setShowErrorOptions] = useState<boolean>(true)
  const [selectedError, setSelectedError] = useState<StackerErrorFlow>(
    ERROR_KINDS.STACKER_HOPPER_EMPTY
  )
  const [selectedRoute, setSelectedRoute] = useState<RecoveryRoute | undefined>(
    undefined
  )

  const handlePrimaryClick = (): void => {
    if (showErrorOptions) {
      const options = getRecoveryOptions(selectedError)
      setSelectedRoute(options[0])
      setShowErrorOptions(false)
    } else if (selectedRoute != null) {
      setSelectedRecoveryOption(selectedRoute)
      void proceedToRouteAndStep(selectedRoute)
    }
  }

  const handleSecondaryClick = (): void => {
    if (!showErrorOptions) {
      setShowErrorOptions(true)
    }
  }

  const buildErrorSelection = (): JSX.Element => (
    <>
      <RadioButton
        key="stacker_empty_option"
        buttonLabel={t('stacker_is_empty')}
        buttonValue={ERROR_KINDS.STACKER_HOPPER_EMPTY}
        onChange={() => {
          setSelectedError(ERROR_KINDS.STACKER_HOPPER_EMPTY)
        }}
        isSelected={selectedError === ERROR_KINDS.STACKER_HOPPER_EMPTY}
        radioButtonType="large"
        largeDesktopBorderRadius={!isOnDevice}
      />
      <RadioButton
        key="stacker_latch_jammed_option"
        buttonLabel={t('stacker_latch_is_jammed')}
        buttonValue={ERROR_KINDS.STACKER_SHUTTLE_EMPTY}
        onChange={() => {
          setSelectedError(ERROR_KINDS.STACKER_SHUTTLE_EMPTY)
        }}
        isSelected={selectedError === ERROR_KINDS.STACKER_SHUTTLE_EMPTY}
        radioButtonType="large"
        largeDesktopBorderRadius={!isOnDevice}
      />
    </>
  )

  const buildRecoveryOptions = (): JSX.Element => (
    <RecoveryOptions
      validRecoveryOptions={getRecoveryOptions(selectedError)}
      setSelectedRoute={setSelectedRoute}
      selectedRoute={selectedRoute}
      getRecoveryOptionCopy={getRecoveryOptionCopy}
      errorKind={selectedError}
      isOnDevice={isOnDevice}
    />
  )

  return (
    <RecoverySingleColumnContentWrapper>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText
          oddStyle="level4HeaderSemiBold"
          desktopStyle="headingSmallBold"
          css={ODD_SECTION_TITLE_STYLE}
        >
          {isOnDevice ? t('check_stacker') : t('stacker_what_is_wrong')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {showErrorOptions ? buildErrorSelection() : buildRecoveryOptions()}
        </Flex>
      </Flex>
      <RecoveryFooterButtons
        primaryBtnOnClick={handlePrimaryClick}
        secondaryBtnOnClick={
          !showErrorOptions ? handleSecondaryClick : undefined
        }
      />
    </RecoverySingleColumnContentWrapper>
  )
}
