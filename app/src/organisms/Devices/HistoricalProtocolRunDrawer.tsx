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
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  Link,
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
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'
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
  const { t } = useTranslation('run_details')
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

  const isOutOfDate =
    typeof lastModifiedDeckCal === 'string' &&
    uniqueLabwareOffsets != null &&
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
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('data_out_of_date')}
        </StyledText>
        <StyledText as="p">{t('robot_was_recalibrated')}</StyledText>
      </Flex>
    </Banner>
  ) : null

  const protocolFilesData =
    allProtocolDataFiles.length === 0 ? (
      <NoData text={t('no_files_included')} />
    ) : (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText>{t('protocol_files')}</StyledText>
        <Flex
          direction={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_FLEX_START}
          alignItems={ALIGN_END}
          gridGap={SPACING.spacing24}
          color={COLORS.grey60}
          padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
        >
          <Box width="33%">
            <StyledText
              as="p"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              datatest-id="RecentProtocolRun_Drawer_fileNameTitle"
            >
              {t('name')}
            </StyledText>
          </Box>
          <Box width="33%">
            <StyledText
              as="p"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              datatest-id="RecentProtocolRun_Drawer_fileDateTitle"
            >
              {t('date')}
            </StyledText>
          </Box>
          <Box width="34%">
            <StyledText
              as="p"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              datatest-id="RecentProtocolRun_Drawer_fileDownloadTitle"
            >
              {t('download')}
            </StyledText>
          </Box>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {allProtocolDataFiles.map((fileData, index) => {
            const { createdAt, name } = fileData
            return (
              <Flex
                key={index}
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
                  <StyledText as="p">{name}</StyledText>
                </Flex>
                <Box width="33%">
                  <StyledText as="p">
                    {format(new Date(createdAt), 'M/d/yy HH:mm:ss')}
                  </StyledText>
                </Box>
                <Box width="34%">
                  <Link
                    role="button"
                    css={TYPOGRAPHY.linkPSemiBold}
                    onClick={() => {}} // TODO (nd: 06/18/2024) get file and download
                  >
                    <StyledText as="p" textTransform="capitalize">
                      {t('download')}
                      <Icon
                        name="download"
                        size="1rem"
                        marginLeft="0.4375rem"
                      />
                    </StyledText>
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
      <NoData text={t('no_offsets_available')} />
    ) : (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {outOfDateBanner}
        <StyledText textTransform="capitalize">
          {t('labware_offset_data')}
        </StyledText>
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
            <StyledText
              as="p"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              datatest-id="RecentProtocolRun_Drawer_locationTitle"
            >
              {t('location')}
            </StyledText>
          </Box>
          <Box width="33%" padding={`${SPACING.spacing4} ${SPACING.spacing8}`}>
            <StyledText
              as="p"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              datatest-id="RecentProtocolRun_Drawer_labwareTitle"
            >
              {t('labware')}
            </StyledText>
          </Box>
          <Box width="34%" padding={`${SPACING.spacing4} ${SPACING.spacing8}`}>
            <StyledText
              as="p"
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              datatest-id="RecentProtocolRun_Drawer_labwareOffsetDataTitle"
            >
              {t('labware_offset_data')}
            </StyledText>
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
                key={index}
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
                  <StyledText
                    as="label"
                    fontWeight="semiBold"
                    borderRadius="6px"
                    padding="3px"
                    minWidth="max-content"
                    css={css`
                      border: 1px solid;
                    `}
                  >
                    {offset.location.slotName}
                  </StyledText>
                  <StyledText as="p">
                    {offset.location.moduleModel != null
                      ? getModuleDisplayName(offset.location.moduleModel)
                      : null}
                  </StyledText>
                </Flex>
                <Box width="33%">
                  <StyledText as="p" title={labwareName}>
                    {labwareName}
                  </StyledText>
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
      {protocolFilesData}
      {labwareOffsets}
    </Flex>
  )
}

interface NoDataProps {
  text: string
}

function NoData(props: NoDataProps): JSX.Element {
  const { text } = props
  return (
    <Flex
      backgroundColor={COLORS.grey35}
      padding={`${SPACING.spacing24} ${SPACING.spacing8}`}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      height="8.25rem"
      borderRadius={BORDERS.borderRadius8}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
    >
      <Icon name="alert-circle" size="1.5rem" color={COLORS.grey60}></Icon>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {text}
      </StyledText>
    </Flex>
  )
}
