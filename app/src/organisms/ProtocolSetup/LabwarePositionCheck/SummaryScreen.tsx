import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_START,
  C_BLUE,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  PrimaryBtn,
  SPACING_3,
  SPACING_4,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { DeckMap } from './DeckMap'
import { SectionList } from './SectionList'
import { LabwareOffsetsSummary } from './LabwareOffsetsSummary'
import { useIntroInfo } from './hooks'

export const SummaryScreen = (): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const { protocolData } = useProtocolDetails()
  if (introInfo == null) return null
  if (protocolData == null) return null
  const labwareIds = Object.keys(protocolData.labware)
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo

  return (
    <Flex margin={SPACING_3} flexDirection={DIRECTION_COLUMN}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_3}
        marginLeft={SPACING_3}
      >
        {t('lpc_complete_summary_screen_heading')}
      </Text>
      <Flex justifyContent={JUSTIFY_START} alignItems={ALIGN_START}>
        <Flex flex={'1 1 40%'} flexDirection={DIRECTION_COLUMN}>
          <SectionList
            primaryPipetteMount={primaryPipetteMount}
            secondaryPipetteMount={secondaryPipetteMount}
            sections={sections}
            completedSections={sections}
          />

          <DeckMap completedLabwareIdSections={labwareIds} />
        </Flex>
        <Flex flex={'1 1 80%'} marginRight={SPACING_4}>
          <LabwareOffsetsSummary />
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <PrimaryBtn
          title={t('close_and_apply_offset_data')}
          backgroundColor={C_BLUE} // TODO immediately: hook up CTA
        >
          {t('close_and_apply_offset_data')}
        </PrimaryBtn>
      </Flex>
    </Flex>
  )
}
