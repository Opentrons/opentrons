// // import { css } from '@emotion/react' // Keep this if you still need the css helper for other things
import styled from '@emotion/styled' // Import styled

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  Btn, // Keep Btn
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  NO_WRAP,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { MouseEventHandler, ReactNode } from 'react'
import type { IconName } from '@opentrons/components'

interface RobotSettingButtonProps {
  settingName: string
  onClick: MouseEventHandler
  iconName?: IconName
  settingInfo?: string
  rightElement?: ReactNode
  dataTestId?: string
}

// Create a styled version of Btn
const StyledButton = styled(Btn)`
  width: 100%;
  margin-bottom: ${SPACING.spacing8};
  background-color: ${COLORS.grey35};
  padding: ${SPACING.spacing20} ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadius16};

  &:active {
    background-color: ${COLORS.grey50};
  }
`

export function RobotSettingButton({
  settingName,
  iconName,
  onClick,
  settingInfo,
  rightElement,
  dataTestId,
}: RobotSettingButtonProps): JSX.Element {
  return (
    // Use the StyledButton instead of Btn with a css prop
    <StyledButton
      onClick={onClick}
      display={DISPLAY_FLEX} // These props should ideally be handled by the Btn component itself
      flexDirection={DIRECTION_ROW} // or incorporated into the styled block if they are static
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      data-testid={dataTestId}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
        width="100%"
        whiteSpace={NO_WRAP}
      >
        {iconName != null ? (
          <Icon name={iconName} size="3rem" color={COLORS.black90} />
        ) : null}
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing2}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
        >
          <LegacyStyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {settingName}
          </LegacyStyledText>
          {settingInfo != null ? (
            <LegacyStyledText
              color={COLORS.grey60}
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              textAlign={TYPOGRAPHY.textAlignLeft}
            >
              {settingInfo}
            </LegacyStyledText>
          ) : null}
        </Flex>
      </Flex>
      {rightElement != null ? (
        rightElement
      ) : (
        <Flex gridGap={SPACING.spacing40} alignItems={ALIGN_CENTER}>
          <Icon name="more" size="3rem" color={COLORS.black90} />
        </Flex>
      )}
    </StyledButton>
  )
}
