import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { TwoColumn } from '/app/molecules/InterventionModal'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { RECOVERY_MAP } from '../constants'
import type { RecoveryContentProps } from '../types'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

export function TwoColTextAndImage(
  props: RecoveryContentProps
): JSX.Element | null {
  const { routeUpdateActions, recoveryMap } = props
  const {
    LOAD_LABWARE_SHUTTLE_AND_RETRY,
    MANUAL_REPLACE_STACKER_AND_RETRY,
    MANUAL_LOAD_IN_STACKER_AND_SKIP,
  } = RECOVERY_MAP
  const { route } = recoveryMap
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions
  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    void proceedNextStep()
  }

  const buildTitle = (): string => {
    switch (route) {
      case LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE:
        return t('load_labware_shuttle_onto_track')
      case MANUAL_REPLACE_STACKER_AND_RETRY.ROUTE:
      case MANUAL_LOAD_IN_STACKER_AND_SKIP.ROUTE:
        return t('clear_track_of_obstructions')
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
      case MANUAL_REPLACE_STACKER_AND_RETRY.ROUTE:
      case MANUAL_LOAD_IN_STACKER_AND_SKIP.ROUTE:
        return t('clear_track_of_obstructions_and_close_door')
      default:
        console.error(
          `TwoColTextAndImage:buildBannerText: Unexpected recovery option ${route}. Handle retry step copy explicitly.`
        )
        return 'UNEXPECTED RECOVERY OPTION'
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
            <Trans
              t={t}
              i18nKey={buildBody()}
              components={{ block: <LegacyStyledText as="p" /> }}
            />
          </StyledText>
        </Flex>
        <Flex>{buildImage()}</Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={goBackPrevStep}
      ></RecoveryFooterButtons>
    </RecoverySingleColumnContentWrapper>
  )
}
