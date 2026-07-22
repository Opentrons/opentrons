import { useTranslation } from 'react-i18next'
import first from 'lodash/first'

import { COLORS, ListItem, StyledText } from '@opentrons/components'
import { useRunDataFileMetadata } from '@opentrons/react-api-client'

import { useNotifyImageFileQuery } from '/app/resources/dataFiles/useNotifyImageFileQuery'

import styles from './protocolrunrecords.module.css'

import type { RunData } from '@opentrons/api-client'
import type { ProtocolResource } from '@opentrons/shared-data'

interface RunRecordDrawerProps {
  run: RunData
  runProtocol?: ProtocolResource
}

type UseRunRecordDrawerFilesResult = Array<{
  translationKey: string
  value: string
}>

const getRunRecordDrawerFiles = (args: {
  protocolName: string
  runDateTime: string
  hasImages: boolean
  hasOutputFiles: boolean
  csvRtpFileName: string | null
}): UseRunRecordDrawerFilesResult => {
  const {
    protocolName,
    runDateTime,
    hasImages,
    hasOutputFiles,
    csvRtpFileName,
  } = args
  const tranformedProtocolName = protocolName
    .replaceAll(' ', '_')
    .replaceAll('.', '')
  const dateStringUtc = runDateTime.replaceAll(':', '_')

  return [
    {
      translationKey: 'file_name_protocol',
      value: `${tranformedProtocolName}.py`,
    },
    {
      translationKey: 'file_name_run_log',
      value: `${tranformedProtocolName}_${dateStringUtc}.json`,
    },
    {
      translationKey: 'file_name_labware_offsets',
      value: `${tranformedProtocolName}_${dateStringUtc}_offsetdata.json`,
    },
    ...(hasImages
      ? [
          {
            translationKey: 'file_name_images',
            value: `${tranformedProtocolName}_${dateStringUtc}_images/`,
          },
        ]
      : []),
    ...(hasOutputFiles
      ? [
          {
            translationKey: 'file_name_output_files',
            value: `${tranformedProtocolName}_${dateStringUtc}_output/`,
          },
        ]
      : []),
    ...(csvRtpFileName != null
      ? [
          {
            translationKey: 'file_name_runtime_parameters',
            value: csvRtpFileName,
          },
        ]
      : []),
  ]
}

export function RunRecordDrawer(props: RunRecordDrawerProps): JSX.Element {
  const { run, runProtocol } = props
  const { t } = useTranslation('device_details')
  const { data: runImages } = useNotifyImageFileQuery(run.id)
  const { data: runDataFilesData } = useRunDataFileMetadata(run.id)
  const hasImages = (runImages?.data.length ?? 0) > 0
  const hasNonImageOutputFiles =
    (runDataFilesData?.data ?? []).filter(
      item => item.mimeType !== 'image/jpeg'
    ).length > 0
  const protocolName = runProtocol?.metadata.protocolName
  const runDateTime = run.createdAt
  const csvRtpFiles =
    'runTimeParameters' in run
      ? run.runTimeParameters.filter(rtp => rtp.type === 'csv_file')
      : []
  const csvRtpFileName = first(csvRtpFiles)?.file?.name ?? null
  const drawerFilesData = getRunRecordDrawerFiles({
    protocolName: protocolName ?? '',
    runDateTime,
    hasImages,
    hasOutputFiles: hasNonImageOutputFiles,
    csvRtpFileName,
  })

  return (
    <div className={styles.run_record_drawer_container}>
      <div className={styles.run_record_drawer_header}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('file_type')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('file_name')}
        </StyledText>
      </div>
      {drawerFilesData.map(({ translationKey, value }) => {
        return (
          <ListItem
            // assumed unique
            key={translationKey}
            type="defaultOnColor"
            className={styles.run_record_file_item}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(translationKey)}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">{value}</StyledText>
          </ListItem>
        )
      })}
    </div>
  )
}
