import { useTranslation } from 'react-i18next'

import {
  BORDERS,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getDisplayVolume } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type {
  LabwareDefinition,
  LabwareVolumeUnits,
} from '@opentrons/shared-data'
import type { LabwareWellGroupProperties } from '/app/local-resources/labware'

export interface AllWellPropertiesProps {
  definition: LabwareDefinition
  className?: string
}

export interface WellPropertiesProps {
  wellProperties: LabwareWellGroupProperties
  wellLabel: string
  displayVolumeUnits: LabwareVolumeUnits
}

const BOTTOM_SHAPE_TO_ICON = {
  v: 'ot-v-bottom',
  u: 'ot-u-bottom',
  flat: 'ot-flat-bottom',
} as const

export function WellProperties(props: WellPropertiesProps): ReactNode {
  const { t } = useTranslation('labware_details')
  const { wellProperties, wellLabel, displayVolumeUnits: units } = props

  const { totalLiquidVolume: vol, metadata } =
    (wellProperties != null && wellProperties) || {}
  const { wellBottomShape } = (metadata != null && metadata) || {}
  const wellBottomValue = wellBottomShape != null ? t(wellBottomShape) : null

  return (
    <Box
      border={BORDERS.lineBorder}
      padding={SPACING.spacing16}
      marginBottom={SPACING.spacing16}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText forwardedAs="h6">{t('max_volume')}</StyledText>
          <StyledText forwardedAs="p">
            {vol != null
              ? `${String(getDisplayVolume(vol, units, 2))} ${String(units)}`
              : t('various')}
          </StyledText>
        </Flex>
        {wellBottomShape != null && wellBottomValue && (
          <Flex flexDirection={DIRECTION_ROW}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              marginRight={SPACING.spacing16}
            >
              <StyledText forwardedAs="h6">
                {t(wellLabel)} {t('shape')}
              </StyledText>
              <StyledText forwardedAs="p">{wellBottomValue}</StyledText>
            </Flex>
            <Icon
              height="1.25rem"
              name={BOTTOM_SHAPE_TO_ICON[wellBottomShape]}
            />
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
