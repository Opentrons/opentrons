import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import { getIsOnDevice } from '/app/redux/config'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCDoorOpen(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { commandUtils } = props
  const { dismissDoorOpenError, headerCommands } = commandUtils
  const isOnDevice = useSelector(getIsOnDevice)
  // Door-open 409s return immediately. "Try again" replaces "Move gantry
  // to front" in the same slot, so the originating click would dismiss
  // this overlay before it is visible.
  const [isRetryArmed, setIsRetryArmed] = useState(false)

  useEffect(() => {
    setIsRetryArmed(true)
  }, [])

  const handleTryAgain = (): void => {
    if (!isRetryArmed) {
      return
    }
    dismissDoorOpenError()
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      desktopFooterBtnCopy={t('try_again')}
      desktopHeaderBtnCopy={t('exit')}
      oddHeaderBtnCopy={t('try_again')}
      onClickButton={handleTryAgain}
      buttonIsDisabled={!isRetryArmed}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: headerCommands.handleCloseWithoutHome,
      }}
      contentStyle={isOnDevice ? CHILDREN_CONTAINER_STYLE : undefined}
    >
      <Flex css={CONTAINER_STYLE}>
        <Icon name="ot-alert" css={ICON_STYLE} color={COLORS.red50} />
        <Flex css={COPY_CONTAINER_STYLE}>
          <StyledText
            oddStyle="level3HeaderBold"
            desktopStyle="headingSmallBold"
          >
            {t('door_is_open')}
          </StyledText>
          <StyledText
            oddStyle="level4HeaderRegular"
            desktopStyle="bodyDefaultRegular"
          >
            {t('close_door_and_try_again')}
          </StyledText>
        </Flex>
      </Flex>
    </LPCContentContainer>
  )
}

const CONTAINER_STYLE = css`
  padding: ${SPACING.spacing40};
  height: 100%;
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing24};
`

const COPY_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  gap: ${SPACING.spacing4};
`

const ICON_STYLE = css`
  height: ${SPACING.spacing40};
  width: ${SPACING.spacing40};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: ${SPACING.spacing60};
    width: ${SPACING.spacing60};
  }
`

// The design system makes a padding exception for this view.
const CHILDREN_CONTAINER_STYLE = css`
  margin-top: 7.75rem;
  flex-direction: ${DIRECTION_COLUMN};
  height: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: 0 ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60};
    gap: ${SPACING.spacing40};
  }
`
