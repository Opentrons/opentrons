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
  const { routeUpdateActions, recoveryMap } = props
  const { LOAD_LABWARE_SHUTTLE_AND_RETRY } = RECOVERY_MAP
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
            {buildBody()}
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
