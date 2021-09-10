import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  Flex,
  Text,
  C_MED_GRAY,
  COLOR_WARNING,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_START,
  FONT_BODY_1_DARK,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING_2,
  SPACING_3,
  SPACING_7,
  COLOR_SUCCESS,
} from '@opentrons/components'

interface CollapsibleStepProps {
  expanded: boolean
  title: string
  description: string
  label: string
  toggleExpanded: () => void
  children: React.ReactNode
  calibrationComplete?: boolean
}

export function CollapsibleStep({
  expanded,
  title,
  description,
  label,
  toggleExpanded,
  children,
  calibrationComplete,
}: CollapsibleStepProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup'])
  return (
    <Flex flexDirection={DIRECTION_COLUMN} paddingX={SPACING_3}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} onClick={toggleExpanded}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text
            as="h6"
            color={C_MED_GRAY}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            fontSize={FONT_SIZE_BODY_1}
          >
            {label}
          </Text>
          <Text as="h5" css={FONT_HEADER_DARK} marginTop={SPACING_2}>
            {title}
          </Text>
          <Text as="p" css={FONT_BODY_1_DARK} marginTop={SPACING_2}>
            {description}
          </Text>
        </Flex>
        {calibrationComplete !== undefined && (
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_START}
            marginLeft={SPACING_7}
          >
            <Icon
              size={SIZE_1}
              color={calibrationComplete ? COLOR_SUCCESS : COLOR_WARNING}
              marginRight={SPACING_2}
              name={calibrationComplete ? 'check-circle' : 'alert-circle'}
            />
            <Text fontSize={FONT_SIZE_BODY_1}>
              {calibrationComplete
                ? t('calibration_ready')
                : t('calibration_needed')}
            </Text>
          </Flex>
        )}
        <Icon size={SIZE_1} name={expanded ? 'minus' : 'plus'} />
      </Flex>
      {expanded ? children : null}
    </Flex>
  )
}
