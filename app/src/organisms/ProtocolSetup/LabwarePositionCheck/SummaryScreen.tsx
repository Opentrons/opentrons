import {
  ALIGN_CENTER,
  Box,
  C_BLUE,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  PrimaryBtn,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import * as React from 'react'
import { DeckMap } from './DeckMap'
import { SectionList } from './SectionList'
import { LabwareOffsetsSummary } from './LabwareOffsetsSummary'
import { useIntroInfo, useLabwareIdsBySection } from './hooks'
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
interface SummaryScreenProps {
  onCloseClick: () => unknown
}

export const SummaryScreen = (props: SummaryScreenProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const labwareIdsBySection = useLabwareIdsBySection()
  if (introInfo == null) return null
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo
  const allSections = sections.length

  return (
    <Box margin={SPACING_3}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_3}
      >
        {t('lpc_complete_summary_screen_heading')}
      </Text>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex marginRight={SPACING_5}>
            <SectionList
              primaryPipetteMount={primaryPipetteMount}
              secondaryPipetteMount={secondaryPipetteMount}
              sections={sections}
              completedSections={[
                sections[allSections - 1],
                sections[allSections - 2],
                sections[allSections - 3],
                sections[allSections - 4],
              ]}
            />
          </Flex>
          <Flex justifyContent={JUSTIFY_CENTER}>
            <DeckMap
              completedLabwareIdSections={
                labwareIdsBySection[
                  (sections[sections.length - 1],
                  sections[sections.length - 2],
                  sections[sections.length - 3],
                  sections[sections.length - 4])
                ]
              }
            />
          </Flex>
        </Flex>
        <Box width="60%" padding={SPACING_3}>
          <LabwareOffsetsSummary />
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <PrimaryBtn
          title={t('close_and_apply_offset_data')}
          backgroundColor={C_BLUE}
          onClick={() => props.onCloseClick}
        >
          {t('close_and_apply_offset_data')}
        </PrimaryBtn>
      </Flex>
    </Box>
  )
}
