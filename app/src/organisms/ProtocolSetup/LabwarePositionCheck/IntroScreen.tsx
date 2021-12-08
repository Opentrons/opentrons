import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  NewPrimaryBtn,
  Text,
  Flex,
  Box,
  AlertItem,
  useInterval,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  FONT_SIZE_BODY_2,
  SPACING_6,
} from '@opentrons/components'
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import { getLatestLabwareOffsetCount } from '../LabwarePositionCheck/utils/getLatestLabwareOffsetCount'
import { SectionList } from './SectionList'
import { DeckMap } from './DeckMap'
import { useIntroInfo, useLabwareIdsBySection } from './hooks'

export const INTERVAL_MS = 3000

export const IntroScreen = (props: {
  beginLPC: () => void
}): JSX.Element | null => {
  const introInfo = useIntroInfo()
  const labwareIdsBySection = useLabwareIdsBySection()
  const { t } = useTranslation(['labware_position_check', 'shared'])

  const currentProtocolRun = useCurrentProtocolRun()
  const currentRunData = currentProtocolRun.runRecord?.data
  const labwareOffsetCount = getLatestLabwareOffsetCount(
    currentRunData?.labwareOffsets ?? []
  )

  const [sectionIndex, setSectionIndex] = React.useState<number>(0)
  const rotateSectionIndex = (): void =>
    setSectionIndex((sectionIndex + 1) % sections.length)
  useInterval(rotateSectionIndex, INTERVAL_MS)

  if (introInfo == null) return null
  const {
    primaryPipetteMount,
    secondaryPipetteMount,
    firstTiprackSlot,
    sections,
  } = introInfo

  const currentSection = sections[sectionIndex]
  const labwareIdsToHighlight = labwareIdsBySection[currentSection]

  return (
    <Box margin={SPACING_3}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        id={`IntroScreen_labware_position_check_overview`}
      >
        {t('labware_position_check_overview')}
      </Text>
      <Trans
        t={t}
        i18nKey="position_check_description"
        components={{
          block: <Text fontSize={FONT_SIZE_BODY_2} marginBottom={SPACING_2} />,
        }}
      ></Trans>
      {labwareOffsetCount !== 0 && (
        <AlertItem
          type="warning"
          title={t('labware_offsets_deleted_warning')}
        />
      )}
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <Flex marginLeft={SPACING_6}>
          <SectionList
            sections={sections}
            currentSection={currentSection}
            primaryPipetteMount={primaryPipetteMount}
            secondaryPipetteMount={secondaryPipetteMount}
          />
        </Flex>
        <Box width="60%" padding={SPACING_2}>
          <DeckMap labwareIdsToHighlight={labwareIdsToHighlight} />
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_3}>
        <NewPrimaryBtn
          title={t('start_position_check', {
            initial_labware_slot: firstTiprackSlot,
          })}
          onClick={props.beginLPC}
        >
          {t('start_position_check', {
            initial_labware_slot: firstTiprackSlot,
          })}
        </NewPrimaryBtn>
      </Flex>
    </Box>
  )
}
