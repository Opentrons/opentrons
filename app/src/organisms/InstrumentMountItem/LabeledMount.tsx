import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  Flex,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  BORDERS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import type { Mount } from '../../redux/pipettes/types'

const MountButton = styled.button<{ isAttached: boolean }>`
  display: flex;
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_FLEX_START};
  padding: ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusSize3};
  background-color: ${({ isAttached }) =>
    isAttached ? COLORS.green3 : COLORS.light1};
  &:hover,
  &:active,
  &:focus {
    background-color: ${({ isAttached }) =>
      isAttached ? COLORS.green3Pressed : COLORS.light1Pressed};
  }
`
interface LabeledMountProps {
  mount: Mount | 'extension'
  instrumentName: string | null
  handleClick: React.MouseEventHandler
}

export function LabeledMount(props: LabeledMountProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { mount, instrumentName, handleClick } = props
  const ninetySixDislayName = 'Flex 96-Channel 1000 μL'

  return (
    <MountButton onClick={handleClick} isAttached={instrumentName != null}>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Flex
          flex="1 0 auto"
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing24}
        >
          <StyledText
            as="h4"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textAlign={TYPOGRAPHY.textAlignLeft}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            fontSize={TYPOGRAPHY.fontSize28}
            width="15.625rem"
          >
            {instrumentName === ninetySixDislayName
              ? t('left_right')
              : t('mount', { side: mount })}
          </StyledText>
          <StyledText
            flex="5"
            as="h4"
            color={COLORS.darkBlack70}
            textAlign={TYPOGRAPHY.textAlignLeft}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSize28}
          >
            {instrumentName == null ? t('empty') : instrumentName}
          </StyledText>
        </Flex>
        <Icon name="more" size="3rem" />
      </Flex>
    </MountButton>
  )
}
