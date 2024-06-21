import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  ALIGN_END,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  InfoScreen,
  JUSTIFY_FLEX_START,
  Link,
  OVERFLOW_HIDDEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'
import { useFeatureFlag } from '../../redux/config'
import { Banner } from '../../atoms/Banner'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useDeckCalibrationData } from './hooks'
import { OffsetVector } from '../../molecules/OffsetVector'
import type { RunData } from '@opentrons/api-client'

interface HistoricalProtocolRunDrawerProps {
  run: RunData
  robotName: string
}

export function HistoricalProtocolRunDrawer(
  props: HistoricalProtocolRunDrawerProps
): JSX.Element | null {
  const { i18n, t } = useTranslation('run_details')
  const { run, robotName } = props
  const allLabwareOffsets = run.labwareOffsets?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const { data } = useAllCsvFilesQuery(run.protocolId ?? '')
  const allProtocolDataFiles = data != null ? data.data.files : []
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
  const enableCsvFile = useFeatureFlag('enableCsvFile')

  const isOutOfDate =
    typeof lastModifiedDeckCal === 'string' &&
    uniqueLabwareOffsets != null &&
    uniqueLabwareOffsets.length > 0 &&
    new Date(lastModifiedDeckCal).getTime() >
      new Date(
        uniqueLabwareOffsets[uniqueLabwareOffsets?.length - 1].createdAt
      ).getTime()
  const outOfDateBanner = isOutOfDate ? (
    <Banner
      type="warning"
      marginTop={SPACING.spacing8}
      iconMarginLeft={SPACING.spacing4}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('data_out_of_date')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('robot_was_recalibrated')}
        </LegacyStyledText>
      </Flex>
    </Banner>
  ) : null

  const protocolFilesData =
    allProtocolDataFiles.length === 0 ? (
      <InfoScreen contentType="noFiles" t={t} backgroundColor={COLORS.grey35} />
    ) : (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <LegacyStyledText>{t('protocol_files')}</LegacyStyledText>
        <Flex
          direction={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_FLEX_START}
          alignItems={ALIGN_END}
          gridGap={SPACING.spacing24}
          color={COLORS.grey60}
          padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        >
          <Box width="33%">
            <LegacyStyledText
              as="p"
              datatest-id="RecentProtocolRun_Drawer_fileNameTitle"
            >
              {t('name')}
            </LegacyStyledText>
          </Box>
          <Box width="33%">
            <LegacyStyledText
              as="p"
              datatest-id="RecentProtocolRun_Drawer_fileDateTitle"
            >
              {t('date')}
            </LegacyStyledText>
          </Box>
          <Box width="34%">
            <LegacyStyledText
              as="p"
              datatest-id="RecentProtocolRun_Drawer_fileDownloadTitle"
            >
              {t('download')}
            </LegacyStyledText>
          </Box>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {allProtocolDataFiles.map((fileData, index) => {
            const { createdAt, name } = fileData
            return (
              <Flex
                key={`csv_file_${index}`}
                justifyContent={JUSTIFY_FLEX_START}
                alignItems={ALIGN_CENTER}
                padding={SPACING.spacing12}
                backgroundColor={COLORS.white}
                borderRadius={BORDERS.borderRadius4}
                gridGap={SPACING.spacing24}
              >
                <Flex
                  width="33%"
                  gridGap={SPACING.spacing4}
                  alignItems={ALIGN_CENTER}
                >
                  <LegacyStyledText
                    as="p"
                    css={css`
                      overflow: ${OVERFLOW_HIDDEN};
                      text-overflow: ellipsis;
                    `}
                  >
                    {name}
                  </LegacyStyledText>
                </Flex>
                <Box width="33%">
                  <LegacyStyledText as="p">
                    {format(new Date(createdAt), 'M/d/yy HH:mm:ss')}
                  </LegacyStyledText>
                </Box>
                <Box width="34%">
                  <Link
                    role="button"
                    css={TYPOGRAPHY.linkPSemiBold}
                    onClick={() => {}} // TODO (nd: 06/18/2024) get file and download
                  >
                    <Flex alignItems={ALIGN_CENTER}>
                      <LegacyStyledText as="p">
                        {t('download')}
                      </LegacyStyledText>
                      <Icon
                        name="download"
                        size="1rem"
                        marginLeft="0.4375rem"
                      />
                    </Flex>
                  </Link>
                </Box>
              </Flex>
            )
          })}
        </Flex>
      </Flex>
    )

  const labwareOffsets =
    uniqueLabwareOffsets == null || uniqueLabwareOffsets.length === 0 ? (
      <InfoScreen
        contentType="noLabwareOffsetData"
        t={t}
        backgroundColor={COLORS.grey35}
      />
    ) : (
      // <InfoScreen contentType="noLabwareOffsetData" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {outOfDateBanner}
        <LegacyStyledText>
          {i18n.format(t('labware_offset_data'), 'capitalize')}
        </LegacyStyledText>
        <Flex
          direction={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_FLEX_START}
          alignItems={ALIGN_END}
          gridGap={SPACING.spacing4}
          color={COLORS.grey60}
          padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        >
          <Box
            width="33%"
            paddingY={`${SPACING.spacing4} ${SPACING.spacing8} ${SPACING.spacing4} ${SPACING.spacing4}`}
          >
            <LegacyStyledText
              as="p"
              datatest-id="RecentProtocolRun_Drawer_locationTitle"
            >
              {i18n.format(t('location'), 'capitalize')}
            </LegacyStyledText>
          </Box>
          <Box width="33%" padding={`${SPACING.spacing4} ${SPACING.spacing8}`}>
            <LegacyStyledText
              as="p"
              datatest-id="RecentProtocolRun_Drawer_labwareTitle"
            >
              {i18n.format(t('labware'), 'capitalize')}
            </LegacyStyledText>
          </Box>
          <Box width="34%" padding={`${SPACING.spacing4} ${SPACING.spacing8}`}>
            <LegacyStyledText
              as="p"
              datatest-id="RecentProtocolRun_Drawer_labwareOffsetDataTitle"
            >
              {i18n.format(t('labware_offset_data'), 'sentenceCase')}
            </LegacyStyledText>
          </Box>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
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
                key={`labware_offset_${index}`}
                justifyContent={JUSTIFY_FLEX_START}
                alignItems={ALIGN_CENTER}
                padding={SPACING.spacing12}
                backgroundColor={COLORS.white}
                borderRadius={BORDERS.borderRadius4}
                gridGap={SPACING.spacing24}
              >
                <Flex
                  width="33%"
                  gridGap={SPACING.spacing4}
                  alignItems={ALIGN_CENTER}
                >
                  {/* TODO (nd: 06/20/2024) finalize small version of LocationIcon w/ Design and implement below */}
                  <LegacyStyledText
                    as="label"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    borderRadius="6px"
                    padding="3px"
                    minWidth="max-content"
                    css={css`
                      border: 1px solid;
                    `}
                  >
                    {offset.location.slotName}
                  </LegacyStyledText>
                  <LegacyStyledText as="p">
                    {offset.location.moduleModel != null
                      ? getModuleDisplayName(offset.location.moduleModel)
                      : null}
                  </LegacyStyledText>
                </Flex>
                <Box width="33%">
                  <LegacyStyledText as="p" title={labwareName}>
                    {labwareName}
                  </LegacyStyledText>
                </Box>
                <Box width="34%">
                  <OffsetVector
                    {...offset.vector}
                    fontSize={TYPOGRAPHY.fontSizeLabel}
                    as="p"
                  />
                </Box>
              </Flex>
            )
          })}
        </Flex>
      </Flex>
    )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing24}
      backgroundColor={COLORS.grey20}
      width="100%"
      padding={SPACING.spacing16}
    >
      {enableCsvFile ? protocolFilesData : null}
      {labwareOffsets}
    </Flex>
  )
}
