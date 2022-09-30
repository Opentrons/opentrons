import * as React from 'react'
import capitalize from 'lodash/capitalize'

import {
  Flex,
  Icon,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../text'
interface StatusLabelProps {
  status: string
  backgroundColor: string
  iconColor?: string
  textColor?: string
  fontWeight?: number
  iconSize?: string
  pulse?: boolean
  id?: string
}

export const StatusLabel = (props: StatusLabelProps): JSX.Element | null => {
  const {
    status,
    backgroundColor,
    iconColor,
    textColor,
    fontWeight,
    iconSize,
    pulse,
    id,
  } = props

  return (
    <Flex>
      <Flex
        backgroundColor={backgroundColor}
        borderRadius={BORDERS.radiusSoftCorners}
        gridGap={SPACING.spacing2}
        paddingX="0.375rem"
        paddingY={SPACING.spacing1}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing2}
        marginBottom={SPACING.spacing2}
        data-testid={`status_label_${status}_${id}`}
      >
        {iconColor != null ? (
          <Icon
            name="circle"
            color={iconColor}
            size={iconSize ?? '0.25rem'}
            data-testid="status_circle"
          >
            {pulse != null && pulse ? (
              <animate
                attributeName="fill"
                values={`${iconColor}; transparent`}
                dur="1s"
                calcMode="discrete"
                repeatCount="indefinite"
                data-testid="pulsing_status_circle"
              />
            ) : null}
          </Icon>
        ) : null}
        <StyledText
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={fontWeight ?? TYPOGRAPHY.fontWeightRegular}
          color={textColor ?? COLORS.bluePressed}
        >
          {capitalize(status)}
        </StyledText>
      </Flex>
    </Flex>
  )
}
