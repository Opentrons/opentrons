import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_START,
  Box,
  C_BLUE,
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
    <Box margin={SPACING_3}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_3}
        marginLeft={SPACING_3}
      >
        {t('lpc_complete_summary_screen_heading')}
      </Text>
      <Flex
        justifyContent={JUSTIFY_START}
        alignItems={ALIGN_START}
        marginLeft="-2.5rem" // TODO remove negative margin when fixing SectionList marginLeft
      >
        <Box width="50%">
          <SectionList
            primaryPipetteMount={primaryPipetteMount}
            secondaryPipetteMount={secondaryPipetteMount}
            sections={sections}
            completedSections={sections}
          />
          <Flex justifyContent={JUSTIFY_CENTER}>
            <DeckMap completedLabwareIdSections={labwareIds} />
          </Flex>
        </Box>
        <Box width="80%" height="100%" marginRight={SPACING_4}>
          <LabwareOffsetsSummary />
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <PrimaryBtn
          title={t('close_and_apply_offset_data')}
          backgroundColor={C_BLUE} // TODO immediately: hook up CTA
        >
          {t('close_and_apply_offset_data')}
        </PrimaryBtn>
      </Flex>
    </Box>
  )
}
