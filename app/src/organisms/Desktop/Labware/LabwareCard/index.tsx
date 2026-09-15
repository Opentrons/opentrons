import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import startCase from 'lodash/startCase'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_GRID,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  LegacyStyledText,
  OVERFLOW_WRAP_ANYWHERE,
  RobotWorkSpace,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getLabwareDefIsStandard,
  getLabwareDisplayName,
  getLabwareViewBox,
} from '@opentrons/shared-data'

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
  const displayName = getLabwareDisplayName(definition)
  const displayCategory = startCase(definition.metadata.displayCategory)
  const isCustomDefinition = !getLabwareDefIsStandard(definition)

  const viewBox = getLabwareViewBox(definition)

  const xDimensionOverride = [
    'opentrons_universal_flat_adapter',
    'opentrons_universal_flat_adapter_type_b',
  ].includes(definition.parameters.loadName)
    ? UNIVERSAL_FLAT_ADAPTER_X_DIMENSION
    : viewBox.xDimension

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
      <Box marginRight={SPACING.spacing24}>
        <RobotWorkSpace
          viewBox={`${viewBox.minX} ${viewBox.minY} ${xDimensionOverride} ${viewBox.yDimension}`}
        >
          {() => (
            <LabwareRender
              definition={definition}
              positioningMode="passThrough"
            />
          )}
        </RobotWorkSpace>
      </Box>
      {/* labware category name min:7.5 rem for the longest, Aluminum Block  */}
      <Box marginRight={SPACING.spacing16}>
        <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
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
            <LegacyStyledText forwardedAs="h3">{displayName}</LegacyStyledText>
            {isCustomDefinition ? (
              <LegacyStyledText forwardedAs="label" color={COLORS.grey50}>
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
                  forwardedAs="label"
                  marginLeft={SPACING.spacing4}
                >
                  {t('branded:opentrons_def')}
                </LegacyStyledText>
              </Flex>
            )}
          </Box>
          <Box paddingTop={SPACING.spacing16}>
            <LegacyStyledText
              forwardedAs="h6"
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.grey60}
            >
              {t('api_name')}
            </LegacyStyledText>

            <Box overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
              <LegacyStyledText forwardedAs="p">{apiName}</LegacyStyledText>
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
            <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_FLEX_END}>
              <LegacyStyledText forwardedAs="label" color={COLORS.grey50}>
                {t('date_added')}
              </LegacyStyledText>
              <LegacyStyledText forwardedAs="label" color={COLORS.grey50}>
                {format(new Date(modified), 'MM/dd/yyyy')}
              </LegacyStyledText>
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
