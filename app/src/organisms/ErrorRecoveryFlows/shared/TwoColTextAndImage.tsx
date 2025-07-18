import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import stackerImage from '/app/assets/images/stacker_shuttle_empty.png'
import { TwoColumn } from '/app/molecules/InterventionModal'

import { RECOVERY_MAP, REENGAGE_LATCH_ROUTES } from '../constants'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'

export function TwoColTextAndImage(
  props: RecoveryContentProps
): JSX.Element | null {
  const { routeUpdateActions, recoveryMap, recoveryCommands } = props
  const {
    STACKER_SHUTTLE_MISSING_RETRY,
    STACKER_STALLED_RETRY,
    ROBOT_IN_MOTION,
    STACKER_STALLED_SKIP,
    STACKER_SHUTTLE_EMPTY_SKIP,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_HOPPER_EMPTY_RETRY,
  } = RECOVERY_MAP
  const { route, step } = recoveryMap
  const {
    proceedNextStep,
    goBackPrevStep,
    handleMotionRouting,
  } = routeUpdateActions
  const { closeLabwareLatch } = recoveryCommands
  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    switch (route) {
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        if (REENGAGE_LATCH_ROUTES.includes(step)) {
          void handleMotionRouting(true, ROBOT_IN_MOTION.ROUTE).then(() => {
            void closeLabwareLatch().then(() => {
              void proceedNextStep()
            })
          })
        } else {
          void proceedNextStep()
        }
        break
      default:
        void proceedNextStep()
        break
    }
  }

  const buildTitle = (): string => {
    switch (route) {
      case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        if (step === STACKER_SHUTTLE_MISSING_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY) {
          return t('ensure_stacker_shuttle_empty')
        } else {
          return t('load_labware_shuttle_onto_track')
        }
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        if (step === STACKER_SHUTTLE_EMPTY_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY) {
          return t('ensure_stacker_shuttle_empty')
        } else if (REENGAGE_LATCH_ROUTES.includes(step)) {
          return t('prepare_for_stacker_latch_reengage')
        } else {
          return t('empty_stacker_of_labware_above_latch')
        }
      case STACKER_STALLED_SKIP.ROUTE:
        return t('clear_track_of_obstructions')
      case STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case STACKER_STALLED_RETRY.ROUTE:
        if (step === STACKER_STALLED_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY) {
          return t('ensure_stacker_shuttle_empty')
        } else {
          return t('clear_track_of_obstructions')
        }
      default:
        console.error(
          `TwoColTextAndImage: Unexpected recovery option: ${route}. Handle retry step copy explicitly.`
        )
        return 'UNEXPECTED RECOVERY OPTION'
    }
  }

  const buildBody = (): string | null => {
    switch (route) {
      case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        if (step === STACKER_SHUTTLE_MISSING_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY) {
          return t('empty_shuttle_to_retry_retrieve')
        } else {
          return t('take_any_necessary_precautions_before_loading_shuttle')
        }
      case STACKER_STALLED_SKIP.ROUTE:
        return t('clear_track_of_obstructions_and_close_door')
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        if (STACKER_SHUTTLE_EMPTY_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY) {
          return t('empty_shuttle_to_retry_retrieve')
        } else if (REENGAGE_LATCH_ROUTES.includes(step)) {
          return t('stacker_latch_will_reengage')
        } else {
          return t('empty_stacker_of_labware_above_latch_labware_stuck')
        }
      case STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case STACKER_STALLED_RETRY.ROUTE:
        if (step === STACKER_STALLED_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY) {
          return t('empty_shuttle_to_retry_retrieve')
        } else {
          return t('clear_track_of_obstructions_and_close_door')
        }
      default:
        console.error(
          `TwoColTextAndImage:buildBannerText: Unexpected recovery option ${route}. Handle retry step copy explicitly.`
        )
        return 'UNEXPECTED RECOVERY OPTION'
    }
  }

  const buildButtonText = (): string => {
    switch (route) {
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        if (REENGAGE_LATCH_ROUTES.includes(step)) {
          return t('re_engage_latch')
        } else {
          return t('continue')
        }
      default:
        console.error(
          `TwoColTextAndImage:buildButtonText: Unexpected recovery option ${route}. Handle retry step copy explicitly.`
        )
        return t('continue')
    }
  }

  const buildImage = (): JSX.Element => {
    switch (route) {
      case STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case STACKER_STALLED_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        return (
          <Flex justifyContent={JUSTIFY_CENTER} width="18.75rem" height="15rem">
            <img src={stackerImage} alt="Stacker shuttle empty" />
          </Flex>
        )
    }
    return <Flex>image place holder</Flex>
  }

  const HEADING_STYLE = css`
    gap: ${SPACING.spacing8};
    width: 100%;
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      gap: ${SPACING.spacing8};
      width: 27rem;
    }
  `

  const DESCRIPTION_STYLE = css`
    gap: ${SPACING.spacing16};
    width: 100%;
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      gap: ${SPACING.spacing24};
    }
  `

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <Flex flexDirection={DIRECTION_COLUMN} css={HEADING_STYLE}>
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
          >
            {buildTitle()}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} css={DESCRIPTION_STYLE}></Flex>
          <StyledText
            oddStyle="level4HeaderRegular"
            desktopStyle="bodyDefaultRegular"
          >
            <Trans
              t={t}
              i18nKey={buildBody()}
              components={{
                block: (
                  <StyledText
                    oddStyle="level4HeaderRegular"
                    desktopStyle="bodyDefaultRegular"
                  />
                ),
              }}
            />
          </StyledText>
        </Flex>
        <Flex>{buildImage()}</Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={goBackPrevStep}
        primaryBtnTextOverride={buildButtonText()}
      ></RecoveryFooterButtons>
    </RecoverySingleColumnContentWrapper>
  )
}
