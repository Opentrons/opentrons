import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_START,
  DIRECTION_COLUMN,
  Flex,
  Box,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  NewPrimaryBtn,
  SPACING,
  Text,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import { useTrackEvent } from '../../../redux/analytics'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useLPCSuccessToast } from '../../ProtocolSetup/hooks'
import { DeprecatedDeckMap } from './DeprecatedDeckMap'
import { DeprecatedSectionList } from './DeprecatedSectionList'
import { DeprecatedLabwareOffsetsSummary } from './DeprecatedLabwareOffsetsSummary'
import {
  useIntroInfo,
  useLabwareOffsets,
  LabwareOffsets,
} from '../deprecatedHooks'
import { useProtocolDetailsForRun } from '../../Devices/hooks'

import type { SavePositionCommandData } from './types'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'

/**
 *
 * @deprecated
 */
export const DeprecatedSummaryScreen = (props: {
  savePositionCommandData: SavePositionCommandData
  onCloseClick: () => unknown
}): JSX.Element | null => {
  const { savePositionCommandData } = props
  const runId = useCurrentRunId()
  const [labwareOffsets, setLabwareOffsets] = React.useState<LabwareOffsets>([])
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const { protocolData } = useProtocolDetailsForRun(runId)
  const trackEvent = useTrackEvent()
  useLabwareOffsets(
    savePositionCommandData,
    protocolData as LegacySchemaAdapterOutput
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
  const labwareIds = protocolData.labware.map(item => item.id)
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo
  const applyLabwareOffsets = (): void => {
    trackEvent({ name: 'applyLabwareOffsetData', properties: {} })
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
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <Text
        as="h3"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING.spacing4}
        marginLeft={SPACING.spacing4}
      >
        {t('lpc_complete_summary_screen_heading')}
      </Text>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_START}>
        <Flex flex="1 1 22%" flexDirection={DIRECTION_COLUMN}>
          <DeprecatedSectionList
            primaryPipetteMount={primaryPipetteMount}
            secondaryPipetteMount={secondaryPipetteMount}
            sections={sections}
            completedSections={sections}
          />
          <Box size={SPACING.spacing3} />
          <DeprecatedDeckMap completedLabwareIds={labwareIds} />
        </Flex>
        <Box size={SPACING.spacing3} />
        <DeprecatedLabwareOffsetsSummary offsetData={labwareOffsets} />
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginY={SPACING.spacing4}>
        <NewPrimaryBtn
          title={t('close_and_apply_offset_data')}
          id="Lpc_summaryScreen_applyOffsetButton"
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
