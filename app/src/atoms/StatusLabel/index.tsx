import capitalize from 'lodash/capitalize'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

interface StatusLabelProps {
  status: string
  backgroundColor: string
  showIcon?: boolean
  iconColor?: string
  textColor?: string
  fontWeight?: number
  iconSize?: string
  pulse?: boolean
  id?: string
  capitalizeStatus?: boolean
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
    showIcon = true,
    id,
    capitalizeStatus = true,
  } = props

  return (
    <Flex>
      <Flex
        backgroundColor={backgroundColor}
        borderRadius={BORDERS.borderRadius4}
        gridGap={SPACING.spacing4}
        paddingX={SPACING.spacing6}
        paddingY={SPACING.spacing2}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing4}
        marginBottom={SPACING.spacing4}
        data-testid={
          id != null ? `status_label_${status}_${id}` : `status_label_${status}`
        }
      >
        {showIcon ? (
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
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={fontWeight ?? TYPOGRAPHY.fontWeightRegular}
          color={textColor ?? COLORS.blue60}
        >
          {capitalizeStatus ? capitalize(status) : status}
        </LegacyStyledText>
      </Flex>
    </Flex>
  )
}
