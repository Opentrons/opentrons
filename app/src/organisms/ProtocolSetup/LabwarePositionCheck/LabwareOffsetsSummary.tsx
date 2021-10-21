import {
  Box,
  C_DISABLED,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_BODY_1_DARK,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
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
    offsetData: { x: 1.1, y: 2.1, z: 3.1 },
  },
  {
    deckSlot: 'Slot 3',
    labware: 'Opentrons 96 Tip Rack 20µL',
    offsetData: { x: 0.0, y: -1.2, z: 1.1 },
  },
  {
    deckSlot: 'Slot 5',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 5.1, y: 2.2, z: 3.1 },
  },
  {
    deckSlot: 'Slot 6',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 0.0, y: 0.0, z: 0.0 },
  },
  {
    deckSlot: 'Slot 7',
    labware: 'Opentrons Mixed Tube Rack',
    offsetData: { x: 0.0, y: 0.0, z: 0.0 },
  },
]

export const LabwareOffsetsSummary = (): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const offsetData = getOffsetDataInfo().map(({ offsetData }) => offsetData)

  return (
    <React.Fragment>
      <Box
        padding={SPACING_4}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        width="106%"
        height="20rem"
      >
        <Text
          as={'h5'}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          marginBottom={SPACING_3}
        >
          {t('labware_offsets_summary_title')}
        </Text>
        <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_CENTER}>
          <Box
            width="20%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              marginBottom={SPACING_3}
              color={C_DISABLED}
              fontSize={FONT_SIZE_CAPTION}
            >
              {t('labware_offsets_summary_deckslot')}
            </Text>
            {getOffsetDataInfo().map(({ deckSlot }) => {
              return (
                <Flex key={deckSlot} height="30%" css={FONT_BODY_1_DARK}>
                  {deckSlot}
                </Flex>
              )
            })}
          </Box>
          <Box
            width="50%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              marginBottom={SPACING_3}
              color={C_DISABLED}
              fontSize={FONT_SIZE_CAPTION}
            >
              {t('labware_offsets_summary_labware')}
            </Text>
            {getOffsetDataInfo().map(({ labware }) => {
              return (
                <Flex key={labware} height="30%" css={FONT_BODY_1_DARK}>
                  {labware}
                </Flex>
              )
            })}
          </Box>
          <Box
            width="30%"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              marginBottom={SPACING_3}
              color={C_DISABLED}
              fontSize={FONT_SIZE_CAPTION}
            >
              {t('labware_offsets_summary_offset')}
            </Text>
            {offsetData.map(({ x, y, z }) => {
              return x === 0 && y === 0 && z === 0 ? (
                <Flex height="30%" css={FONT_BODY_1_DARK}>
                  {t('no_labware_offsets')}
                </Flex>
              ) : (
                <Flex height="30%" css={FONT_BODY_1_DARK}>
                  <Text as={'span'} marginRight={'0.15rem'}>
                    <strong>X</strong>
                  </Text>
                  <Text as={'span'} marginRight={'0.4rem'}>
                    {x}
                  </Text>
                  <Text as={'span'} marginRight={'0.15rem'}>
                    <strong>Y</strong>
                  </Text>
                  <Text as={'span'} marginRight={'0.4rem'}>
                    {y}
                  </Text>
                  <Text as={'span'} marginRight={'0.15rem'}>
                    <strong>Z</strong>
                  </Text>
                  <Text as={'span'} marginRight={'0.4rem'}>
                    {z}
                  </Text>
                </Flex>
              )
            })}
          </Box>
        </Flex>
      </Box>
    </React.Fragment>
  )
}
