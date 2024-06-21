import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { formatDistance } from 'date-fns'
import last from 'lodash/last'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_END,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  OVERFLOW_WRAP_ANYWHERE,
  OVERFLOW_WRAP_BREAK_WORD,
  SIZE_2,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  useLongPress,
} from '@opentrons/components'
import {
  useHost,
  useMostRecentSuccessfulAnalysisAsDocumentQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { LongPressModal } from './LongPressModal'
import { formatTimeWithUtcLabel } from '../../resources/runs'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

const REFETCH_INTERVAL = 5000

export function ProtocolCard(props: {
  protocol: ProtocolResource
  longPress: React.Dispatch<React.SetStateAction<boolean>>
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetProtocolId: (targetProtocolId: string) => void
  lastRun?: string
}): JSX.Element {
  const {
    protocol,
    lastRun,
    longPress,
    setShowDeleteConfirmationModal,
    setTargetProtocolId,
  } = props
  const history = useHistory()
  const [showIcon, setShowIcon] = React.useState<boolean>(false)
  const [
    showFailedAnalysisModal,
    setShowFailedAnalysisModal,
  ] = React.useState<boolean>(false)
  const { t, i18n } = useTranslation(['protocol_info', 'branded'])
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const longpress = useLongPress()
  const queryClient = useQueryClient()
  const host = useHost()

  const { id: protocolId, analysisSummaries } = protocol
  const {
    data: mostRecentSuccessfulAnalysis,
  } = useMostRecentSuccessfulAnalysisAsDocumentQuery(
    protocolId,
    analysisSummaries,
    {
      enabled: protocol != null,
      refetchInterval: analysisData =>
        analysisData == null ? REFETCH_INTERVAL : false,
    }
  )
  const { data: mostRecentAnalysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocol.analysisSummaries)?.id ?? null,
    {
      enabled: protocol != null,
      refetchInterval: analysisData =>
        analysisData == null ? REFETCH_INTERVAL : false,
    }
  )

  const analysisForProtocolCard =
    mostRecentSuccessfulAnalysis == null
      ? mostRecentAnalysis
      : mostRecentSuccessfulAnalysis
  const isFailedAnalysis =
    (analysisForProtocolCard != null &&
      'result' in analysisForProtocolCard &&
      (analysisForProtocolCard.result === 'error' ||
        analysisForProtocolCard.result === 'not-ok')) ??
    false

  const isPendingAnalysis = analysisForProtocolCard == null

  const handleProtocolClick = (
    longpress: UseLongPressResult,
    protocolId: string
  ): void => {
    if (isFailedAnalysis) {
      setShowFailedAnalysisModal(true)
    } else if (!longpress.isLongPressed) {
      history.push(`/protocols/${protocolId}`)
    }
  }

  React.useEffect(() => {
    if (longpress.isLongPressed) {
      longPress(true)
      setTargetProtocolId(protocol.id)
    }
  }, [longpress.isLongPressed, longPress, protocol.id, setTargetProtocolId])

  const failedAnalysisHeader: ModalHeaderBaseProps = {
    title: i18n.format(t('protocol_analysis_failed'), 'capitalize'),
    hasExitIcon: true,
    onClick: () => {
      setShowFailedAnalysisModal(false)
    },
  }

  const handleDeleteProtocol = (): void => {
    if (host != null && protocol.id != null) {
      setShowIcon(true)
      getProtocol(host, protocol.id)
        .then(
          response =>
            response.data.links?.referencingRuns.map(({ id }) => id) ?? []
        )
        .then(referencingRunIds => {
          return Promise.all(
            referencingRunIds?.map(runId => deleteRun(host, runId))
          )
        })
        .then(() => deleteProtocol(host, protocol.id))
        .then(() =>
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
        )
        .then(() => {
          setShowIcon(false)
        })
        .catch((e: Error) => {
          console.error(`error deleting resources: ${e.message}`)
        })
    } else {
      console.error(
        'could not delete resources because the robot host is unknown'
      )
    }
  }

  const PUSHED_STATE_STYLE = css`
    &:active {
      background-color: ${longpress.isLongPressed
        ? ''
        : isFailedAnalysis
        ? COLORS.red40
        : COLORS.grey50};
    }
  `

  return (
    <Flex
      alignItems={isFailedAnalysis ? ALIGN_END : ALIGN_CENTER}
      backgroundColor={isFailedAnalysis ? COLORS.red35 : COLORS.grey35}
      borderRadius={BORDERS.borderRadius16}
      marginBottom={SPACING.spacing8}
      gridGap={SPACING.spacing48}
      onClick={() => {
        handleProtocolClick(longpress, protocol.id)
      }}
      padding={SPACING.spacing24}
      ref={longpress.ref}
      css={PUSHED_STATE_STYLE}
    >
      {isPendingAnalysis ? (
        <Icon
          name="ot-spinner"
          aria-label="Protocol is loading"
          spin
          size={SIZE_2}
          marginY={'-1.5rem'}
          opacity={0.7}
        />
      ) : null}
      <Flex
        width="28.9375rem"
        overflowWrap={OVERFLOW_WRAP_ANYWHERE}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        {isFailedAnalysis ? (
          <Flex
            color={COLORS.red60}
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing8}
          >
            <Icon
              name="ot-alert"
              size="1.5rem"
              aria-label="failedAnalysis_icon"
            />
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {i18n.format(t('failed_analysis'), 'capitalize')}
            </StyledText>
          </Flex>
        ) : null}
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          opacity={isPendingAnalysis ? 0.7 : 1}
        >
          {protocolName}
        </StyledText>
      </Flex>
      <Flex width="9.25rem">
        <StyledText as="p" color={COLORS.grey60} whiteSpace="nowrap">
          {lastRun != null
            ? formatDistance(new Date(lastRun), new Date(), {
                addSuffix: true,
              }).replace('about ', '')
            : t('no_history')}
        </StyledText>
      </Flex>
      <Flex width="12.5rem" whiteSpace="nowrap">
        <StyledText as="p" color={COLORS.grey60}>
          {formatTimeWithUtcLabel(protocol.createdAt)}
        </StyledText>
        {longpress.isLongPressed && !isFailedAnalysis && (
          <LongPressModal
            longpress={longpress}
            protocolId={protocol.id}
            setTargetProtocolId={setTargetProtocolId}
            setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
          />
        )}
        {(showFailedAnalysisModal ||
          (isFailedAnalysis && longpress.isLongPressed)) && (
          <Modal
            header={failedAnalysisHeader}
            onOutsideClick={() => {
              setShowFailedAnalysisModal(false)
            }}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing32}
              width="100%"
            >
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing8}
                maxWidth="100%"
                whiteSpace="break-spaces"
              >
                <Trans
                  t={t}
                  i18nKey={t('error_analyzing', { protocolName })}
                  components={{
                    block: (
                      <StyledText
                        as="p"
                        css={css`
                          display: -webkit-box;
                          -webkit-box-orient: vertical;
                          -webkit-line-clamp: 3;
                          overflow: hidden;
                          overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
                          height: max-content;
                        `}
                      />
                    ),
                    bold: <strong />,
                  }}
                />

                <StyledText as="p">
                  {t('branded:delete_protocol_from_app')}
                </StyledText>
              </Flex>
              <SmallButton
                onClick={handleDeleteProtocol}
                buttonText={t('delete_protocol')}
                buttonType="alert"
                iconPlacement={showIcon ? 'startIcon' : undefined}
                iconName={showIcon ? 'ot-spinner' : undefined}
                disabled={showIcon}
              />
            </Flex>
          </Modal>
        )}
      </Flex>
    </Flex>
  )
}
