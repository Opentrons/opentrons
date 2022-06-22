import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import {
  Text,
  Flex,
  Icon,
  SPACING_3,
  SPACING_4,
  SIZE_2,
  C_MED_GRAY,
  Link,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  C_BLUE,
  SPACING_1,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  FONT_SIZE_CAPTION,
  FONT_BODY_1_DARK,
  NewSecondaryBtn,
  FONT_SIZE_BODY_1,
  SPACING_2,
} from '@opentrons/components'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'
import { getConnectedRobotName } from '../../redux/robot/selectors'
import { useTrackEvent } from '../../redux/analytics'
import { Divider } from '../../atoms/structure'
import { getLatestLabwareOffsetCount } from '../LabwarePositionCheck/utils/getLatestLabwareOffsetCount'
import { useProtocolDetails } from '../RunDetails/hooks'
import { useMostRecentRunId } from './hooks/useMostRecentRunId'
import { getRunDisplayStatus } from './getRunDisplayStatus'
import { RerunningProtocolModal } from './RerunningProtocolModal'
import { useCloneRun } from './hooks'
import { useProtocolRunAnalyticsData } from '../Devices/hooks'
import type { State } from '../../redux/types'

export function LastRun(): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  const history = useHistory()
  const trackEvent = useTrackEvent()
  const mostRecentRunId = useMostRecentRunId()
  const { data: runRecord, isFetching: isFetchingMostRecentRun } = useRunQuery(
    mostRecentRunId
  )
  const mostRecentRun = runRecord?.data
  const mostRecentProtocolInfo = useProtocolQuery(
    (mostRecentRun?.protocolId as string) ?? null
  )
  const mostRecentProtocol = mostRecentProtocolInfo?.data?.data
  const protocolData = useProtocolDetails()
  //  If mostRecentRun is null, the CTA that uses cloneRun won't appear so this will never be reached
  const { cloneRun } = useCloneRun(
    mostRecentRunId != null ? mostRecentRunId : null
  )
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(
    mostRecentRunId
  )
  const [rerunningProtocolModal, showRerunningProtocolModal] = React.useState(
    false
  )
  const labwareOffsets = mostRecentRun?.labwareOffsets
  const protocolName = protocolData.displayName
  const mostRecentRunFileName =
    mostRecentProtocol != null && mostRecentProtocol.files != null
      ? mostRecentProtocol.files.find(file => file.role === 'main')?.name
      : null
  const mostRecentRunStatus =
    mostRecentProtocol != null && mostRecentRun?.status != null
      ? getRunDisplayStatus(mostRecentRun)
      : null

  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  const labwareOffsetCount = getLatestLabwareOffsetCount(labwareOffsets ?? [])

  const handleCloneRun = async (): Promise<void> => {
    cloneRun()
    history.push('/run')

    const { protocolRunAnalyticsData } = await getProtocolRunAnalyticsData()

    trackEvent({
      name: 'runAgain',
      properties: { ...protocolRunAnalyticsData },
    })
  }

  if (mostRecentRun == null && !isFetchingMostRecentRun) return null
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width={'80%'}>
      <Divider marginY={SPACING_3} />
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginBottom={SPACING_2}>
        <Trans
          t={t}
          i18nKey="robot_name_last_run"
          values={{ robot_name: robotName }}
        />
        <Link
          role={'link'}
          fontSize={FONT_SIZE_BODY_1}
          color={C_BLUE}
          onClick={() => showRerunningProtocolModal(true)}
          id={'RerunningProtocol_Modal'}
          data-testid={'RerunningProtocol_ModalLink'}
        >
          {t('rerunning_protocol_modal_title')}
        </Link>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING_4}
      >
        {mostRecentRun == null && isFetchingMostRecentRun ? (
          <Flex width="100%" justifyContent={JUSTIFY_CENTER}>
            <Icon spin name="ot-spinner" width={SIZE_2} />
          </Flex>
        ) : (
          <>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {t('protocol_name_title')}
              </Text>
              <Text css={FONT_BODY_1_DARK}>
                {protocolName != null ? protocolName : mostRecentRunFileName}
              </Text>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {'Run status'}
              </Text>
              <Text css={FONT_BODY_1_DARK}>{mostRecentRunStatus}</Text>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {t('run_timestamp_title')}
              </Text>
              <Text css={FONT_BODY_1_DARK}>
                {mostRecentRun != null
                  ? format(
                      parseISO(mostRecentRun.createdAt),
                      'yyyy-MM-dd pp xxxxx'
                    )
                  : null}
              </Text>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Text
                marginBottom={SPACING_1}
                color={C_MED_GRAY}
                fontSize={FONT_SIZE_CAPTION}
              >
                {t('labware_offset_data_title')}
              </Text>
              <Text css={FONT_BODY_1_DARK}>
                {labwareOffsetCount === 0 ? (
                  t('no_labware_offset_data')
                ) : (
                  <Trans
                    t={t}
                    i18nKey="labware_offsets_info"
                    values={{ number: labwareOffsetCount }}
                  />
                )}
              </Text>
            </Flex>
            <NewSecondaryBtn
              onClick={handleCloneRun}
              id={'UploadInput_runAgainButton'}
            >
              {t('run_again')}
            </NewSecondaryBtn>
          </>
        )}
      </Flex>
      <Divider />
      {rerunningProtocolModal && (
        <RerunningProtocolModal
          onCloseClick={() => showRerunningProtocolModal(false)}
        />
      )}
    </Flex>
  )
}
