import * as React from 'react'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { format } from 'date-fns'
import {
  Box,
  Text,
  Flex,
  Icon,
  LabwareRender,
  RobotWorkSpace,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  ALIGN_FLEX_END,
} from '@opentrons/components'
import type { LabwareDefAndDate } from './hooks'

export interface LabwareCardProps {
  labware: LabwareDefAndDate
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const { labware } = props
  const { definition, modified } = labware

  const apiName = definition.parameters.loadName
  const displayName = definition?.metadata.displayName
  const displayCategory = startCase(definition.metadata.displayCategory)
  const isCustomDefinition = modified != null
  return (
    <Box
      backgroundColor={COLORS.white}
      color={COLORS.black}
      css={BORDERS.cardOutlineBorder}
      padding={SPACING.spacing4}
      height="7.375rem"
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} height="100%">
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
          <Box width="5rem">
            <RobotWorkSpace
              viewBox={`0 0 ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
            >
              {() => <LabwareRender definition={definition} />}
            </RobotWorkSpace>
          </Box>
          <Text css={TYPOGRAPHY.pSemiBold} width="5.75rem">
            {displayCategory}
          </Text>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Box>
              <Text css={TYPOGRAPHY.h3Regular}>{displayName}</Text>
              {definition.brand.brand === 'Opentrons' && (
                <>
                  <Text css={TYPOGRAPHY.h6Default}>
                    <Icon
                      color={COLORS.blue}
                      name="check-decagram"
                      height=".7rem"
                    />{' '}
                    {t('opentrons_def')}
                  </Text>
                </>
              )}
              {isCustomDefinition && (
                <Text css={TYPOGRAPHY.h6Default} color={COLORS.darkGreyEnabled}>
                  {t('custom_def')}
                </Text>
              )}
            </Box>
            <Box paddingTop={SPACING.spacing4}>
              <Text
                textTransform={TYPOGRAPHY.textTransformUppercase}
                css={TYPOGRAPHY.h6Default}
                color={COLORS.darkGreyEnabled}
              >
                {t('api_name')}
              </Text>
              <Text
                css={TYPOGRAPHY.pRegular}
                onClick={() => navigator.clipboard.writeText(apiName)}
              >
                {apiName} <Icon height=".7rem" name="ot-copy-text"></Icon>
              </Text>
            </Box>
          </Flex>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_FLEX_END}
        >
          <Icon name="dots-vertical" height="1rem" />
          {modified != null && (
            <Text css={TYPOGRAPHY.h6Default} color={COLORS.darkGreyEnabled}>
              {t('date_added')} {format(new Date(modified), 'MM/dd/yyyy')}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
