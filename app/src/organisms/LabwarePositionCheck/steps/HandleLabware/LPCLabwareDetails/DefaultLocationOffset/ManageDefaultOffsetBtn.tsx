import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ReactNode } from 'react'

// A one-off designed button for default offsets.
export function ManageDefaultOffsetBtn({
  isMissingDefaultOffset,
  onClick,
}: {
  isMissingDefaultOffset: boolean
  onClick: () => void
}): ReactNode {
  const { t } = useTranslation('labware_position_check')

  return (
    <PrimaryButton
      onClick={onClick}
      css={customButtonStyle(isMissingDefaultOffset)}
    >
      <Flex css={BUTTON_TEXT_CONTAINER_STYLE}>
        {isMissingDefaultOffset && <Icon name="add" css={ADD_ICON_STYLE} />}
        <StyledText oddStyle="bodyTextSemiBold" desktopStyle="captionSemiBold">
          {isMissingDefaultOffset ? t('add') : t('adjust')}
        </StyledText>
      </Flex>
    </PrimaryButton>
  )
}

const customButtonStyle = (
  isMissingDefaultOffset: boolean
): FlattenSimpleInterpolation => css`
  background-color: ${isMissingDefaultOffset ? '' : 'inherit'};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  border-radius: ${BORDERS.borderRadiusFull};
  border: 1px solid ${COLORS.blue50};
  color: ${isMissingDefaultOffset ? '' : COLORS.blue50};

  &:hover,
  &:focus {
    background-color: ${isMissingDefaultOffset ? '' : 'inherit'};
    color: ${isMissingDefaultOffset ? '' : COLORS.blue60};
    box-shadow: none;
    border: 1px solid ${isMissingDefaultOffset ? COLORS.blue50 : COLORS.blue60};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: ${SPACING.spacing16} ${SPACING.spacing24};
    background-color: ${isMissingDefaultOffset ? COLORS.blue50 : COLORS.blue35};
    border: none;
    color: ${isMissingDefaultOffset ? COLORS.white : COLORS.black90};

    &:hover,
    &:focus,
    &:focus-visible {
      background-color: ${isMissingDefaultOffset ? '' : COLORS.blue40};
      border: none;
      color: ${isMissingDefaultOffset ? COLORS.white : COLORS.black90};
      box-shadow: none;
    }
  }
`

const BUTTON_TEXT_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing8};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const ADD_ICON_STYLE = css`
  width: 0.75rem;
  height: 0.75rem;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 1.75rem;
    height: 1.75rem;
  }
`
