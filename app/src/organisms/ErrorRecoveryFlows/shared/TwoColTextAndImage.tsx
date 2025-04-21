import {
  DIRECTION_COLUMN,
  Flex,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { useTranslation } from 'react-i18next'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { TwoColumn } from '/app/molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RECOVERY_MAP } from '../constants'

import type { RecoveryContentProps } from '../types'
import { css } from 'styled-components'

export function TwoColTextAndImage(
  props: RecoveryContentProps
): JSX.Element | null {
  const { routeUpdateActions, recoveryMap, recoveryCommands } = props
  const {
    LOAD_LABWARE_SHUTTLE_AND_RETRY,
    REPLACE_LABWARE_IN_HOOPER_AND_RETRY,
    ROBOT_IN_MOTION,
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
      case REPLACE_LABWARE_IN_HOOPER_AND_RETRY.ROUTE:
        if (step === REPLACE_LABWARE_IN_HOOPER_AND_RETRY.STEPS.REENGAGE_LATCH) {
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
      case LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE:
        return t('load_labware_shuttle_onto_track')
      case REPLACE_LABWARE_IN_HOOPER_AND_RETRY.ROUTE:
        if (step === REPLACE_LABWARE_IN_HOOPER_AND_RETRY.STEPS.REENGAGE_LATCH) {
          return t('prepare_for_stacker_latch_reengage')
        } else {
          return t('empty_stacker_of_labware_above_latch')
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
      case LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE:
        return t('take_any_necessary_precautions_before_loading_shuttle')
      case REPLACE_LABWARE_IN_HOOPER_AND_RETRY.ROUTE:
        if (step === REPLACE_LABWARE_IN_HOOPER_AND_RETRY.STEPS.REENGAGE_LATCH) {
          return t('stacker_latch_will_reengage')
        } else {
          return t('empty_stacker_of_labware_above_latch_labware_stuck')
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
      case REPLACE_LABWARE_IN_HOOPER_AND_RETRY.ROUTE:
        if (step === REPLACE_LABWARE_IN_HOOPER_AND_RETRY.STEPS.REENGAGE_LATCH) {
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
            {buildBody()}
          </StyledText>
        </Flex>
        <Flex>{buildImage()}</Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        primaryBtnTextOverride={buildButtonText()}
        secondaryBtnOnClick={goBackPrevStep}
      ></RecoveryFooterButtons>
    </RecoverySingleColumnContentWrapper>
  )
}
