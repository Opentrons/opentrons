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
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { useLPCSuccessToast } from '../ProtocolSetup/hooks'
import { DeckMap } from './DeckMap'
import { SectionList } from './SectionList'
import { LabwareOffsetsSummary } from './LabwareOffsetsSummary'
import { useIntroInfo, useLabwareOffsets, LabwareOffsets } from './hooks'
import { useProtocolDetailsForRun } from '../Devices/hooks'

import type { SavePositionCommandData } from './types'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

export const SummaryScreen = (props: {
  savePositionCommandData: SavePositionCommandData
  onCloseClick: () => unknown
}): JSX.Element | null => {
  const { savePositionCommandData } = props
  const runId = useCurrentRunId()
  const [labwareOffsets, setLabwareOffsets] = React.useState<LabwareOffsets>([])
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const { protocolData } = useProtocolDetailsForRun(runId)
  useLabwareOffsets(
    savePositionCommandData,
    protocolData as ProtocolAnalysisFile
  )
    .then(offsets => {
      labwareOffsets.length === 0 && setLabwareOffsets(offsets)
    })
    .catch((e: Error) =>
      console.error(`error getting labware offsets: ${e.message}`)
    )
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  if (runId == null || introInfo == null || protocolData == null) return null
  const labwareIds = Object.keys(protocolData.labware)
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo

  const applyLabwareOffsets = (): void => {
    if (labwareOffsets.length > 0) {
      labwareOffsets.forEach(labwareOffset => {
        createLabwareOffset({
          runId: runId,
          data: {
            definitionUri: labwareOffset.labwareDefinitionUri,
            location: labwareOffset.labwareOffsetLocation,
            vector: labwareOffset.vector,
          },
        }).catch((e: Error) => {
          console.error(`error applying labware offsets: ${e.message}`)
        })
      })
    } else {
      console.error('no labware offset data found')
    }
  }

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
            <DeckMap completedLabwareIds={labwareIds} />
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
            setIsShowingLPCSuccessToast(true)
            props.onCloseClick()
          }}
        >
          {t('close_and_apply_offset_data')}
        </NewPrimaryBtn>
      </Flex>
    </Flex>
  )
}
