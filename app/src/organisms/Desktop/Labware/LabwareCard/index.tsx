import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { format } from 'date-fns'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  OVERFLOW_WRAP_ANYWHERE,
  RobotWorkSpace,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  DISPLAY_GRID,
} from '@opentrons/components'

import { UNIVERSAL_FLAT_ADAPTER_X_DIMENSION } from '../LabwareDetails/Gallery'
import { CustomLabwareOverflowMenu } from './CustomLabwareOverflowMenu'
import type { LabwareDefAndDate } from '/app/local-resources/labware'

export interface LabwareCardProps {
  labware: LabwareDefAndDate
  onClick: () => void
}

export function LabwareCard(props: LabwareCardProps): JSX.Element {
  const { t } = useTranslation(['labware_landing', 'branded'])
  const { definition, modified, filename } = props.labware
  const apiName = definition.parameters.loadName
  const displayName = definition?.metadata.displayName
  const displayCategory = startCase(definition.metadata.displayCategory)
  const isCustomDefinition = definition.namespace !== 'opentrons'
  const xDimensionOverride =
    definition.parameters.loadName === 'opentrons_universal_flat_adapter'
      ? UNIVERSAL_FLAT_ADAPTER_X_DIMENSION
      : definition.dimensions.xDimension

  return (
    <Box
      role="link"
      backgroundColor={COLORS.white}
      color={COLORS.black90}
      paddingLeft={SPACING.spacing16}
      paddingY={SPACING.spacing16}
      height="auto"
      onClick={props.onClick}
      cursor="pointer"
      display={DISPLAY_GRID}
      gridTemplateColumns=" minmax(5rem, 1fr) minmax(7.5rem, 1fr) 4fr minmax(
        3rem,
        1fr
      )"
    >
      <Box id="LabwareCard_labwareImage" marginRight={SPACING.spacing24}>
        <RobotWorkSpace
          viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${xDimensionOverride} ${definition.dimensions.yDimension}`}
        >
          {() => <LabwareRender definition={definition} />}
        </RobotWorkSpace>
      </Box>
      {/* labware category name min:7.5 rem for the longest, Aluminum Block  */}
      <Box marginRight={SPACING.spacing16}>
        <LegacyStyledText css={TYPOGRAPHY.pSemiBold} id="displayCategory">
          {displayCategory}
        </LegacyStyledText>
      </Box>
      {/* labware info */}
      <Box>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Box>
            <LegacyStyledText as="h3" id="LabwareCard_labwareName">
              {displayName}
            </LegacyStyledText>
            {isCustomDefinition ? (
              <LegacyStyledText
                as="label"
                color={COLORS.grey50}
                id="LabwareCard_customDef"
              >
                {t('custom_def')}
              </LegacyStyledText>
            ) : (
              <Flex alignItems={ALIGN_CENTER} marginTop={SPACING.spacing4}>
                <Icon
                  color={COLORS.blue50}
                  name="check-decagram"
                  height=".7rem"
                />
                <LegacyStyledText
                  as="label"
                  id="LabwareCard_opentronsDef"
                  marginLeft={SPACING.spacing4}
                >
                  {t('branded:opentrons_def')}
                </LegacyStyledText>
              </Flex>
            )}
          </Box>
          <Box paddingTop={SPACING.spacing16}>
            <LegacyStyledText
              as="h6"
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.grey60}
              id="LabwareCard_apiName"
            >
              {t('api_name')}
            </LegacyStyledText>

            <Box overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
              <LegacyStyledText as="p">{apiName}</LegacyStyledText>
            </Box>
          </Box>
        </Flex>
      </Box>
      {/* space for custom labware min: 3rem for date */}
      {/* Note kj 06/30/2022 currently this section would not be ideal implementation
        Once the team have an agreement for grid system, we could refactor */}
      <Box marginTop={`-10px`} paddingRight={SPACING.spacing8}>
        {modified != null && filename != null && (
          <Flex
            height="100%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_FLEX_END}
          >
            <CustomLabwareOverflowMenu filename={filename} />
            <Flex flexDirection={DIRECTION_COLUMN}>
              <LegacyStyledText
                as="label"
                color={COLORS.grey50}
                textAlign={TYPOGRAPHY.textAlignRight}
              >
                {t('date_added')}
              </LegacyStyledText>
              <LegacyStyledText
                as="label"
                color={COLORS.grey50}
                id="LabwareCard_dateAdded"
              >
                {format(new Date(modified), 'MM/dd/yyyy')}
              </LegacyStyledText>
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
