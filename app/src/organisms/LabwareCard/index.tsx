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
  ALIGN_CENTER,
  SIZE_1,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { CustomLabwareOverflowMenu } from './CustomLabwareOverflowMenu'
import type { LabwareDefAndDate } from '../../pages/Labware/hooks'

export interface LabwareCardProps {
  labware: LabwareDefAndDate
  onClick: () => void
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const { definition, modified, filename } = props.labware
  const apiName = definition.parameters.loadName
  const displayName = definition?.metadata.displayName
  const displayCategory = startCase(definition.metadata.displayCategory)
  const isCustomDefinition = definition.namespace !== 'opentrons'

  const handleCopyClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    await navigator.clipboard.writeText(apiName)
  }

  return (
    <Box
      role="link"
      backgroundColor={COLORS.white}
      color={COLORS.black}
      css={BORDERS.cardOutlineBorder}
      padding={SPACING.spacing4}
      height="7.375rem"
      onClick={props.onClick}
      cursor="pointer"
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} height="100%">
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
          <Box width="5rem" id="LabwareCard_labwareImage">
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
              <StyledText as="h3" id="LabwareCard_labwareName">
                {displayName}
              </StyledText>
              {isCustomDefinition ? (
                <StyledText
                  as="h6"
                  color={COLORS.darkGreyEnabled}
                  id="LabwareCard_customDef"
                >
                  {t('custom_def')}
                </StyledText>
              ) : (
                <>
                  <StyledText as="h6" id="LabwareCard_opentronsDef">
                    <Icon
                      color={COLORS.blue}
                      name="check-decagram"
                      height=".7rem"
                    />{' '}
                    {t('opentrons_def')}
                  </StyledText>
                </>
              )}
            </Box>
            <Box paddingTop={SPACING.spacing4}>
              <StyledText
                as="h6"
                textTransform={TYPOGRAPHY.textTransformUppercase}
                color={COLORS.darkGreyEnabled}
                id="LabwareCard_apiName"
              >
                {t('api_name')}
              </StyledText>
              <Link
                css={TYPOGRAPHY.pRegular}
                onClick={handleCopyClick}
                role="button"
              >
                <Flex alignItems={ALIGN_CENTER}>
                  {apiName}{' '}
                  <Icon
                    height={SIZE_1}
                    name="copy-text"
                    aria-label="copy-text"
                  />
                </Flex>
              </Link>
            </Box>
          </Flex>
        </Flex>
        {modified != null && filename != null && (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_FLEX_END}
          >
            <CustomLabwareOverflowMenu filename={filename} />
            <StyledText
              as="h6"
              color={COLORS.darkGreyEnabled}
              id="LabwareCard_dateAdded"
            >
              {t('date_added')} {format(new Date(modified), 'MM/dd/yyyy')}
            </StyledText>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
