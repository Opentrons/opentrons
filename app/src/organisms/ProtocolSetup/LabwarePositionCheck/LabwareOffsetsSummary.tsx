import {
  C_DISABLED,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
  SPACING_4,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

const getOffsetDataInfo = (): Array<{
  deckSlot: string
  labware: string
  offsetData: { x: number; y: number; z: number }
}> => [
  {
    deckSlot: 'Slot 1',
    labware: 'Opentrons 96 100mL Tiprack in Temperature Module GEN2',
    offsetData: { x: 1, y: 2, z: 3 },
  },
  {
    deckSlot: 'Slot 3',
    labware: 'Opentrons 96 Tip Rack 20µL',
    offsetData: { x: 0, y: 2, z: 1 },
  },
  {
    deckSlot: 'Slot 5',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 5, y: 2, z: 3 },
  },
  {
    deckSlot: 'Slot 6',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 0, y: 0, z: 0 },
  },
  {
    deckSlot: 'Slot 7',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 0, y: 0, z: 0 },
  },
]

export const LabwareOffsetsSummary = (): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  return (
    <React.Fragment>
      <Flex
        padding={SPACING_4}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING_4}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        width="106%"
      >
        <Text
          as={'h5'}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          marginBottom={SPACING_3}
        >
          {t('labware_offsets_summary_title')}
        </Text>
        <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            marginBottom={SPACING_3}
            color={C_DISABLED}
            fontSize={FONT_SIZE_CAPTION}
          >
            {t('labware_offsets_summary_deckslot')}
          </Text>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            marginBottom={SPACING_3}
            color={C_DISABLED}
            fontSize={FONT_SIZE_CAPTION}
          >
            {t('labware_offsets_summary_labware')}
          </Text>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            marginBottom={SPACING_3}
            color={C_DISABLED}
            fontSize={FONT_SIZE_CAPTION}
          >
            {t('labware_offsets_summary_offset')}
          </Text>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
