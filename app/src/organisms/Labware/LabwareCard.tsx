import * as React from 'react'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { format } from 'date-fns'
import {
  Box,
  Flex,
  Icon,
  Link,
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
import { StyledText } from '../../atoms/text'
import type { LabwareDefAndDate } from './hooks'

export interface LabwareCardProps {
  labware: LabwareDefAndDate
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const { definition, modified } = props.labware
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
          <StyledText css={TYPOGRAPHY.pSemiBold} width="5.75rem">
            {displayCategory}
          </StyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Box>
              <StyledText as="h3">{displayName}</StyledText>
              {definition.brand.brand === 'Opentrons' && (
                <>
                  <StyledText as="h6">
                    <Icon
                      color={COLORS.blue}
                      name="check-decagram"
                      height=".7rem"
                    />{' '}
                    {t('opentrons_def')}
                  </StyledText>
                </>
              )}
              {isCustomDefinition && (
                <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                  {t('custom_def')}
                </StyledText>
              )}
            </Box>
            <Box paddingTop={SPACING.spacing4}>
              <StyledText
                as="h6"
                textTransform={TYPOGRAPHY.textTransformUppercase}
                color={COLORS.darkGreyEnabled}
              >
                {t('api_name')}
              </StyledText>
              <Link
                css={TYPOGRAPHY.pRegular}
                onClick={() => navigator.clipboard.writeText(apiName)}
                role="button"
              >
                {apiName} <Icon height=".7rem" name="ot-copy-text" />
              </Link>
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
            <StyledText as="h6" color={COLORS.darkGreyEnabled}>
              {t('date_added')} {format(new Date(modified), 'MM/dd/yyyy')}
            </StyledText>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
