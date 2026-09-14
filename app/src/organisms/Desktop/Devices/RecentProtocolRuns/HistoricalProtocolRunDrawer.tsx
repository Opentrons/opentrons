import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_END,
  ALIGN_FLEX_START,
  Banner,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  InfoScreen,
  JUSTIFY_FLEX_START,
  LegacyStyledText,
  Link,
  MODULE_ICON_NAME_BY_TYPE,
  OVERFLOW_HIDDEN,
  RobotInfoLabel,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useAllRunImagesRaw,
  useDataFileQuery,
} from '@opentrons/react-api-client'
import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
  getModuleType,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { downloadFile } from '/app/organisms/Desktop/Devices/utils'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useIsFlex, useRobotType } from '/app/redux-resources/robots'
import { useRunGeneratedDataFiles } from '/app/resources/dataFiles/useRunGeneratedDataFiles'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { OffsetTag } from '../../../LabwarePositionCheck'
import { DownloadCsvFileLink } from '../DownloadCsvFileLink'
import { useDeckCalibrationData } from '../hooks'

import type { ReactNode } from 'react'
import type { LabwareOffset, RunData } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

interface HistoricalProtocolRunDrawerProps {
  run: RunData
  protocolName: string
  robotName: string
}

export function HistoricalProtocolRunDrawer(
  props: HistoricalProtocolRunDrawerProps
): JSX.Element | null {
  const { i18n, t } = useTranslation('run_details')
  const { run, robotName } = props
  const isFlex = useIsFlex(robotName)
  const outputFileIds = useRunGeneratedDataFiles(run.id)
  const allLabwareOffsets: LabwareOffset[] =
    run.labwareOffsets?.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) ?? []
  const totalImageFileCount = outputFileIds.jpeg.length
  const totalOutputFileCount = totalImageFileCount + outputFileIds.csv.length

  const runCsvFileIds =
    'runTimeParameters' in run
      ? run.runTimeParameters.reduce<string[]>((acc, parameter) => {
          if (parameter.type === 'csv_file') {
            return parameter.file?.id != null
              ? [...acc, parameter.file?.id]
              : acc
          }
          return acc
        }, [])
      : []
  runCsvFileIds.push(...outputFileIds.csv)

  const uniqueLabwareOffsets = allLabwareOffsets.filter(
    (offset, index, array) => {
      return (
        array.findIndex(
          firstOffset =>
            isEqual(firstOffset.locationSequence, offset.locationSequence) &&
            isEqual(firstOffset.definitionUri, offset.definitionUri)
        ) === index
      )
    }
  )

  const deckCalibrationData =
    useDeckCalibrationData(robotName).deckCalibrationData
  const lastModifiedDeckCal =
    deckCalibrationData != null && 'lastModified' in deckCalibrationData
      ? deckCalibrationData.lastModified
      : null
  const protocolDetails = useMostRecentCompletedAnalysis(run.id)

  const sortedUniqueLwOffsets = uniqueLabwareOffsets.sort((a, b) => {
    const aLabwareName = getLabwareNameForOffset(a, protocolDetails)
    const bLabwareName = getLabwareNameForOffset(b, protocolDetails)

    const nameCompare = aLabwareName.localeCompare(bLabwareName, 'en')
    // Use the original slot name comparison as secondary sort
    if (nameCompare === 0) {
      return a.location.slotName.localeCompare(b.location.slotName, 'en', {
        numeric: true,
      })
    } else {
      return nameCompare
    }
  })

  const isOutOfDate =
    typeof lastModifiedDeckCal === 'string' &&
    sortedUniqueLwOffsets.length > 0 &&
    new Date(lastModifiedDeckCal).getTime() >
      new Date(
        sortedUniqueLwOffsets[sortedUniqueLwOffsets?.length - 1].createdAt
      ).getTime()
  const outOfDateBanner = isOutOfDate ? (
    <Banner
      type="warning"
      marginTop={SPACING.spacing8}
      iconMarginLeft={SPACING.spacing4}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {t('data_out_of_date')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('robot_was_recalibrated')}
        </LegacyStyledText>
      </Flex>
    </Banner>
  ) : null

  const protocolFilesData =
    totalOutputFileCount === 0 ? (
      <InfoScreen content={t('no_files_included')} />
    ) : (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <LegacyStyledText>{t('protocol_files')}</LegacyStyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_FLEX_START}
          alignItems={ALIGN_END}
          gridGap={SPACING.spacing24}
          color={COLORS.grey60}
          padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        >
          <Box width="33%" minWidth="0">
            <LegacyStyledText forwardedAs="p">{t('name')}</LegacyStyledText>
          </Box>
          <Box width="33%" minWidth="0">
            <LegacyStyledText forwardedAs="p">{t('date')}</LegacyStyledText>
          </Box>
          <Box width="34%" minWidth="0">
            <LegacyStyledText forwardedAs="p">{t('download')}</LegacyStyledText>
          </Box>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {outputFileIds.jpeg.length > 0 && (
            <ImagesFileDataRow
              run={run}
              robotName={robotName}
              protocolName={props.protocolName}
            />
          )}
          {runCsvFileIds.map((fileId, index) => {
            return <CsvFileDataRow key={`csv_file_${index}`} fileId={fileId} />
          })}
        </Flex>
      </Flex>
    )

  const labwareOffsets =
    sortedUniqueLwOffsets == null || sortedUniqueLwOffsets.length === 0 ? (
      <InfoScreen content={t('no_offsets_available')} />
    ) : (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {outOfDateBanner}
        <LegacyStyledText>
          {i18n.format(t('labware_offset_data'), 'capitalize')}
        </LegacyStyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_FLEX_START}
          alignItems={ALIGN_END}
          gridGap={SPACING.spacing4}
          color={COLORS.grey60}
          padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        >
          <Box
            width="75%"
            paddingY={`${SPACING.spacing4} ${SPACING.spacing8} ${SPACING.spacing4} ${SPACING.spacing4}`}
          >
            <LegacyStyledText forwardedAs="p">
              {i18n.format(t('labware'), 'capitalize')}
            </LegacyStyledText>
          </Box>
          <Box width="25%" padding={`${SPACING.spacing4} 0`}>
            <LegacyStyledText forwardedAs="p">
              {i18n.format(t('location'), 'capitalize')}
            </LegacyStyledText>
          </Box>
          <Box width="25%" padding={`${SPACING.spacing4} 0`}>
            <LegacyStyledText forwardedAs="p">
              {i18n.format(t('labware_offset_data'), 'sentenceCase')}
            </LegacyStyledText>
          </Box>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {sortedUniqueLwOffsets.map((offset, index) => {
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
            const thermocyclerLocation = isFlex
              ? TC_MODULE_LOCATION_OT3
              : TC_MODULE_LOCATION_OT2
            const slotName =
              offset.location.moduleModel != null &&
              getModuleType(offset.location.moduleModel) ===
                THERMOCYCLER_MODULE_TYPE
                ? thermocyclerLocation
                : offset.location.slotName
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
                <Box width="75%">
                  <LegacyStyledText forwardedAs="p" title={labwareName}>
                    {labwareName}
                  </LegacyStyledText>
                </Box>
                <Flex
                  width="24%"
                  gridGap={SPACING.spacing4}
                  alignItems={ALIGN_CENTER}
                >
                  <RobotInfoLabel deckLabel={slotName} />
                  {offset.locationSequence?.some(
                    seq => seq.kind === 'onLabware'
                  ) && <RobotInfoLabel iconName="stacked" key="stacked-icon" />}
                  {offset.location.moduleModel && (
                    <RobotInfoLabel
                      iconName={
                        MODULE_ICON_NAME_BY_TYPE[
                          getModuleType(offset.location.moduleModel)
                        ]
                      }
                    />
                  )}
                </Flex>
                <Box width="26%">
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing8}
                  >
                    <OffsetTag kind="vector" {...offset.vector} />
                  </Flex>
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
      {protocolFilesData}
      {labwareOffsets}
    </Flex>
  )
}

interface CsvFileDataRowProps {
  fileId: string
}

function CsvFileDataRow(props: CsvFileDataRowProps): JSX.Element | null {
  const { fileId } = props

  const { data: fileData } = useDataFileQuery(fileId)
  if (fileData == null) {
    return null
  }
  const { name, createdAt } = fileData.data
  return (
    <Flex
      justifyContent={JUSTIFY_FLEX_START}
      alignItems={ALIGN_FLEX_START}
      padding={SPACING.spacing12}
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius4}
      gridGap={SPACING.spacing24}
    >
      <Flex
        width="33%"
        minWidth="0"
        gridGap={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
      >
        <LegacyStyledText
          forwardedAs="p"
          css={css`
            overflow: ${OVERFLOW_HIDDEN};
            text-overflow: ellipsis;
          `}
        >
          {name}
        </LegacyStyledText>
      </Flex>
      <Box width="33%" minWidth="0">
        <LegacyStyledText forwardedAs="p">
          {format(new Date(createdAt), 'M/d/yy HH:mm:ss')}
        </LegacyStyledText>
      </Box>
      <Box width="34%" minWidth="0">
        <DownloadCsvFileLink fileId={fileId} fileName={name} />
      </Box>
    </Flex>
  )
}

function ImagesFileDataRow({
  run,
  protocolName,
  robotName,
}: {
  run: RunData
  protocolName: string
  robotName: string
}): ReactNode {
  const { t } = useTranslation('run_details')
  const robotType = useRobotType(robotName)
  const { reportPhotoAccessUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType: robotType,
  })
  const { data: imagesZipFile, isLoading } = useAllRunImagesRaw(run.id)
  const formattedRunTs = format(new Date(run.createdAt), 'yyyyMMdd-HHmmss')
  const buildImagesZipName = (): string =>
    `${robotName}_${protocolName}_${formattedRunTs}.zip`

  return (
    <Flex
      justifyContent={JUSTIFY_FLEX_START}
      alignItems={ALIGN_CENTER}
      padding={SPACING.spacing12}
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius4}
      gridGap={SPACING.spacing24}
    >
      <Flex
        width="33%"
        minWidth="0"
        gridGap={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
      >
        <LegacyStyledText
          forwardedAs="p"
          css={css`
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow-wrap: anywhere;
            overflow: ${OVERFLOW_HIDDEN};
          `}
        >
          {buildImagesZipName()}
        </LegacyStyledText>
      </Flex>
      <Box width="33%" minWidth="0">
        <LegacyStyledText forwardedAs="p">{formattedRunTs}</LegacyStyledText>
      </Box>
      <Box width="34%" minWidth="0">
        <Link
          role="button"
          css={
            imagesZipFile == null
              ? TYPOGRAPHY.darkLinkLabelSemiBoldDisabled
              : TYPOGRAPHY.linkPSemiBold
          }
          onClick={() => {
            if (imagesZipFile != null) {
              downloadFile(imagesZipFile, buildImagesZipName())
              reportPhotoAccessUsage({
                action: 'downloadZip',
              })
            }
          }}
        >
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
            <LegacyStyledText forwardedAs="p">
              {isLoading ? t('loading') : t('download')}
            </LegacyStyledText>
            {!isLoading && <Icon name="download" size="1rem" />}
          </Flex>
        </Link>
      </Box>
    </Flex>
  )
}

const getLabwareNameForOffset = (
  offset: LabwareOffset,
  protocolDetails: CompletedProtocolAnalysis | null
): string => {
  const labwareDefinitions =
    protocolDetails?.commands != null
      ? getLoadedLabwareDefinitionsByUri(protocolDetails?.commands)
      : {}
  const definition = Object.values(labwareDefinitions).find(
    def => getLabwareDefURI(def) === offset.definitionUri
  )
  return definition != null
    ? getLabwareDisplayName(definition)
    : offset.definitionUri
}
