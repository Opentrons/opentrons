import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_START,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  NewPrimaryBtn,
  SPACING_3,
  SPACING_2,
  SPACING_4,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { useLPCSuccessToast } from '../hooks'
import { DeckMap } from './DeckMap'
import { SectionList } from './SectionList'
import { LabwareOffsetsSummary } from './LabwareOffsetsSummary'
import { useIntroInfo, LabwareOffsets } from './hooks'

export const SummaryScreen = (props: {
  labwareOffsets: LabwareOffsets
  applyLabwareOffsets: () => void
  onCloseClick: () => unknown
}): JSX.Element | null => {
  const { labwareOffsets, applyLabwareOffsets } = props
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const { protocolData } = useProtocolDetails()
  const { setShowLPCSuccessToast } = useLPCSuccessToast()
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
        <Flex flex={'1 1 10%'} flexDirection={DIRECTION_COLUMN}>
          <Flex paddingLeft={SPACING_4}>
            <SectionList
              primaryPipetteMount={primaryPipetteMount}
              secondaryPipetteMount={secondaryPipetteMount}
              sections={sections}
              completedSections={sections}
            />
          </Flex>
          <Flex paddingTop={SPACING_2}>
            <DeckMap completedLabwareIdSections={labwareIds} />
          </Flex>
        </Flex>
        <Flex flex={'1 1 45%'}>
          <LabwareOffsetsSummary offsetData={labwareOffsets} />
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <NewPrimaryBtn
          title={t('close_and_apply_offset_data')}
          id={'Lpc_summaryScreen_applyOffsetButton'}
          onClick={() => {
            applyLabwareOffsets()
            setShowLPCSuccessToast()
            props.onCloseClick()
          }}
        >
          {t('close_and_apply_offset_data')}
        </NewPrimaryBtn>
      </Flex>
    </Flex>
  )
}
