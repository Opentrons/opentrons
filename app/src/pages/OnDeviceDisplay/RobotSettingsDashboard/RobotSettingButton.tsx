import * as React from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import type { IconName } from '@opentrons/components'

const SETTING_BUTTON_STYLE = css`
  width: 100%;
  margin-bottom: ${SPACING.spacing8};
  background-color: ${COLORS.light1};
  padding: ${SPACING.spacing20} ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusSize4};
`

interface RobotSettingButtonProps {
  settingName: string
  iconName: IconName
  onClick: React.MouseEventHandler
  settingInfo?: string
  rightElement?: React.ReactNode
}

export function RobotSettingButton({
  settingName,
  iconName,
  onClick,
  settingInfo,
  rightElement
}: RobotSettingButtonProps): JSX.Element {
  return (
    <Btn
      css={SETTING_BUTTON_STYLE}
      onClick={onClick}
      display={DISPLAY_FLEX}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing24}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
      >
        <Icon name={iconName} size="3rem" color={COLORS.darkBlack100} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing2}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
          width="46.25rem"
        >
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {settingName}
          </StyledText>
          {settingInfo != null ? (
            <StyledText
              color={COLORS.darkBlack70}
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              textAlign={TYPOGRAPHY.textAlignLeft}
            >
              {settingInfo}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
      {rightElement != null
        ? rightElement : (
          <Flex gridGap={SPACING.spacing40} alignItems={ALIGN_CENTER}>
            <Icon name="more" size="3rem" color={COLORS.darkBlack100} />
          </Flex>
        )
      }
    </Btn>
  )
}
