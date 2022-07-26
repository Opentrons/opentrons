import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Icon,
  BORDERS,
  SPACING,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { getDisplayVolume } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'

import type {
  LabwareDefinition,
  LabwareWellGroupProperties,
  LabwareVolumeUnits,
} from '../../pages/Labware/types'

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

export function WellProperties(props: WellPropertiesProps): JSX.Element {
  const { t } = useTranslation('labware_details')
  const { wellProperties, wellLabel, displayVolumeUnits: units } = props

  const { totalLiquidVolume: vol, metadata } = wellProperties
  const { wellBottomShape } = metadata
  const wellBottomValue = wellBottomShape != null ? t(wellBottomShape) : null

  return (
    <Box
      border={BORDERS.lineBorder}
      padding={SPACING.spacing4}
      marginBottom={SPACING.spacing4}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <StyledText as="h6">{t('max_volume')}</StyledText>
          <StyledText as="p">
            {vol != null
              ? `${getDisplayVolume(vol, units, 2)} ${units}`
              : t('various')}
          </StyledText>
        </Flex>
        {wellBottomShape != null && wellBottomValue && (
          <Flex flexDirection={DIRECTION_ROW}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              marginRight={SPACING.spacing4}
            >
              <StyledText as="h6">
                {t(wellLabel)} {t('shape')}
              </StyledText>
              <StyledText as="p">{wellBottomValue}</StyledText>
            </Flex>
            <Icon height="20px" name={BOTTOM_SHAPE_TO_ICON[wellBottomShape]} />
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
