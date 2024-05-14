import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  ALIGN_END,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_START,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import { Banner } from '../../atoms/Banner'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useDeckCalibrationData } from './hooks'
import { OffsetVector } from '../../molecules/OffsetVector'
import type { RunData } from '@opentrons/api-client'

interface HistoricalProtocolRunOffsetDrawerProps {
  run: RunData
  robotName: string
}

export function HistoricalProtocolRunOffsetDrawer(
  props: HistoricalProtocolRunOffsetDrawerProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run, robotName } = props
  const allLabwareOffsets = run.labwareOffsets?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const uniqueLabwareOffsets = allLabwareOffsets?.filter(
    (offset, index, array) => {
      return (
        array.findIndex(
          firstOffset =>
            firstOffset.location.slotName === offset.location.slotName &&
            firstOffset.definitionUri === offset.definitionUri
        ) === index && !isEqual(offset.vector, { x: 0, y: 0, z: 0 })
      )
    }
  )

  const deckCalibrationData = useDeckCalibrationData(robotName)
    .deckCalibrationData
  const lastModifiedDeckCal =
    deckCalibrationData != null && 'lastModified' in deckCalibrationData
      ? deckCalibrationData.lastModified
      : null
  const protocolDetails = useMostRecentCompletedAnalysis(run.id)

  if (uniqueLabwareOffsets == null || uniqueLabwareOffsets.length === 0) {
    return (
      <Box
        backgroundColor={COLORS.grey20}
        width="100%"
        padding={`${SPACING.spacing16} ${SPACING.spacing8} ${SPACING.spacing16} ${SPACING.spacing48}`}
      >
        <Box
          backgroundColor={COLORS.white}
          padding={SPACING.spacing24}
          textAlign="center"
        >
          <StyledText as="label">{t('no_offsets_available')}</StyledText>
        </Box>
      </Box>
    )
  }
  const isOutOfDate =
    typeof lastModifiedDeckCal === 'string' &&
    new Date(lastModifiedDeckCal).getTime() >
      new Date(
        uniqueLabwareOffsets[uniqueLabwareOffsets?.length - 1].createdAt
      ).getTime()

  return (
    <Box
      backgroundColor={COLORS.grey20}
      width="100%"
      padding={`${SPACING.spacing16} ${SPACING.spacing8} ${SPACING.spacing16} ${SPACING.spacing48}`}
      borderRadius={BORDERS.borderRadius4}
    >
      {isOutOfDate ? (
        <Banner type="warning" marginTop={SPACING.spacing8}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('data_out_of_date')}
            </StyledText>
            <StyledText as="p">{t('robot_was_recalibrated')}</StyledText>
          </Flex>
        </Banner>
      ) : null}
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={ALIGN_END}>
        <Box
          width="25.25%"
          padding={`${SPACING.spacing4} ${SPACING.spacing8} ${SPACING.spacing4} ${SPACING.spacing4}`}
        >
          <StyledText
            as="label"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            datatest-id="RecentProtocolRun_OffstDrawer_locationTitle"
          >
            {t('location')}
          </StyledText>
        </Box>
        <Box width="39.75%" padding={`${SPACING.spacing4} ${SPACING.spacing8}`}>
          <StyledText
            as="label"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            datatest-id="RecentProtocolRun_OffsetDrawer_labwareTitle"
          >
            {t('labware')}
          </StyledText>
        </Box>
        <Box width="34%" padding={`${SPACING.spacing4} ${SPACING.spacing8}`}>
          <StyledText
            as="label"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            datatest-id="RecentProtocolRun_OffsetDrawer_labwareOffsetDataTitle"
          >
            {t('labware_offset_data')}
          </StyledText>
        </Box>
      </Flex>
      {uniqueLabwareOffsets.map((offset, index) => {
        const labwareDefinitions =
          protocolDetails?.commands != null
            ? getLoadedLabwareDefinitionsByUri(protocolDetails?.commands)
            : {}
        const definition = Object.values(labwareDefinitions).find(
          def => getLabwareDefURI(def) === offset.definitionUri
        )
        const labwareName =
          definition != null
            ? getLabwareDisplayName(definition)
            : offset.definitionUri

        return (
          <Flex
            key={index}
            justifyContent={JUSTIFY_FLEX_START}
            alignItems={ALIGN_CENTER}
            padding={`${SPACING.spacing2} ${SPACING.spacing8}`}
            backgroundColor={COLORS.white}
            marginY={SPACING.spacing4}
            borderRadius={BORDERS.borderRadius4}
            gridGap={SPACING.spacing24}
          >
            <Box width="23.25%">
              <StyledText as="label">
                {t('slot', { slotName: offset.location.slotName })}
                {offset.location.moduleModel != null &&
                  ` - ${getModuleDisplayName(offset.location.moduleModel)}`}
              </StyledText>
            </Box>
            <Box width="38%">
              <StyledText as="label" title={labwareName}>
                {labwareName}
              </StyledText>
            </Box>
            <Box width="33%">
              <OffsetVector
                {...offset.vector}
                fontSize={TYPOGRAPHY.fontSizeLabel}
                as="label"
              />
            </Box>
          </Flex>
        )
      })}
    </Box>
  )
}
