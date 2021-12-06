import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_START,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  AppPrimaryBtn,
  SPACING_3,
  SPACING_4,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import { useLPCSuccessToast } from '../hooks'
import { DeckMap } from './DeckMap'
import { SectionList } from './SectionList'
import { LabwareOffsetsSummary } from './LabwareOffsetsSummary'
import { useIntroInfo, useLabwareOffsets, LabwareOffsets } from './hooks'
import type { SavePositionCommandData } from './types'
import type { ProtocolFile } from '@opentrons/shared-data'

export const SummaryScreen = (props: {
  savePositionCommandData: SavePositionCommandData
  onCloseClick: () => unknown
}): JSX.Element | null => {
  const { savePositionCommandData } = props
  const [labwareOffsets, setLabwareOffsets] = React.useState<LabwareOffsets>([])
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const { protocolData } = useProtocolDetails()
  useLabwareOffsets(savePositionCommandData, protocolData as ProtocolFile<{}>)
    .then(offsets => setLabwareOffsets(offsets))
    .catch((e: Error) =>
      console.error(`error getting labware offsetsL ${e.message}`)
    )
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const { runRecord } = useCurrentProtocolRun()
  const { setShowLPCSuccessToast } = useLPCSuccessToast()

  if (introInfo == null) return null
  if (protocolData == null) return null
  const labwareIds = Object.keys(protocolData.labware)
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo

  const applyLabwareOffsets = (): void => {
    if (labwareOffsets.length > 0) {
      labwareOffsets.forEach(labwareOffset => {
        if (!isEqual(labwareOffset.vector, IDENTITY_VECTOR)) {
          createLabwareOffset({
            runId: runRecord?.data.id as string,
            data: {
              definitionUri: labwareOffset.labwareDefinitionUri,
              location: labwareOffset.labwareLocation,
              vector: labwareOffset.vector,
            },
          }).catch((e: Error) => {
            console.error(`error applying labware offsets: ${e.message}`)
          })
        }
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
          <SectionList
            primaryPipetteMount={primaryPipetteMount}
            secondaryPipetteMount={secondaryPipetteMount}
            sections={sections}
            completedSections={sections}
          />

          <DeckMap completedLabwareIdSections={labwareIds} />
        </Flex>
        <Flex flex={'1 1 45%'}>
          <LabwareOffsetsSummary offsetData={labwareOffsets} />
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <AppPrimaryBtn
          title={t('close_and_apply_offset_data')}
          id={'Lpc_summaryScreen_applyOffsetButton'}
          onClick={() => {
            applyLabwareOffsets()
            setShowLPCSuccessToast()
            props.onCloseClick()
          }}
        >
          {t('close_and_apply_offset_data')}
        </AppPrimaryBtn>
      </Flex>
    </Flex>
  )
}
