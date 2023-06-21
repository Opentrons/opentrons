import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { format, formatDistance } from 'date-fns'
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
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  useLongPress,
} from '@opentrons/components'
import { useHost, useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { LongPressModal } from './LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

export function ProtocolCard(props: {
  protocol: ProtocolResource
  longPress: React.Dispatch<React.SetStateAction<boolean>>
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetProtocol: (targetProtocol: ProtocolResource) => void
  lastRun?: string
}): JSX.Element {
  const {
    protocol,
    lastRun,
    longPress,
    setShowDeleteConfirmationModal,
    setTargetProtocol,
  } = props
  const history = useHistory()
  const [showIcon, setShowIcon] = React.useState<boolean>(false)
  const [
    showFailedAnalysisModal,
    setShowFailedAnalysisModal,
  ] = React.useState<boolean>(false)
  const { t, i18n } = useTranslation('protocol_info')
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const longpress = useLongPress()
  const queryClient = useQueryClient()
  const host = useHost()
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocol.id, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null
  const isFailedAnalysis =
    (mostRecentAnalysis != null &&
      'result' in mostRecentAnalysis &&
      (mostRecentAnalysis.result === 'error' ||
        mostRecentAnalysis.result === 'not-ok')) ??
    false

  const handleProtocolClick = (
    longpress: UseLongPressResult,
    protocolId: string
  ): void => {
    if (isFailedAnalysis) {
      setShowFailedAnalysisModal(true)
    } else if (longpress.isLongPressed !== true) {
      history.push(`/protocols/${protocolId}`)
    }
  }

  React.useEffect(() => {
    if (longpress.isLongPressed) {
      longPress(true)
      setTargetProtocol(protocol)
    }
  }, [longpress.isLongPressed, longPress])

  const failedAnalysisHeader: ModalHeaderBaseProps = {
    title: i18n.format(t('protocol_analysis_failed'), 'capitalize'),
    hasExitIcon: true,
    onClick: () => setShowFailedAnalysisModal(false),
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
            .catch((e: Error) =>
              console.error(`error invalidating runs query: ${e.message}`)
            )
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
  return (
    <Flex
      alignItems={isFailedAnalysis ? ALIGN_END : ALIGN_CENTER}
      backgroundColor={isFailedAnalysis ? COLORS.red3 : COLORS.light1}
      borderRadius={BORDERS.borderRadiusSize4}
      marginBottom={SPACING.spacing8}
      gridGap={SPACING.spacing48}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      padding={SPACING.spacing24}
      ref={longpress.ref}
    >
      <Flex
        width="30.75rem"
        overflowWrap="anywhere"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        {isFailedAnalysis ? (
          <Flex
            color={COLORS.red1}
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
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {protocolName}
        </StyledText>
      </Flex>
      <Flex width="9.25rem" justifyContent={JUSTIFY_CENTER}>
        <StyledText as="p" color={COLORS.darkBlack70}>
          {lastRun != null
            ? formatDistance(new Date(lastRun), new Date(), {
                addSuffix: true,
              }).replace('about ', '')
            : t('no_history')}
        </StyledText>
      </Flex>
      <Flex width="10rem">
        <StyledText as="p" color={COLORS.darkBlack70}>
          {format(new Date(protocol.createdAt), 'M/d/yy HH:mm')}
        </StyledText>
        {longpress.isLongPressed && (
          <LongPressModal
            longpress={longpress}
            protocolId={protocol.id}
            setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
          />
        )}
        {showFailedAnalysisModal && (
          <Modal
            header={failedAnalysisHeader}
            onOutsideClick={() => setShowFailedAnalysisModal(false)}
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
                          overflow-wrap: break-word;
                          height: max-content;
                        `}
                      />
                    ),
                    bold: <strong />,
                  }}
                />

                <StyledText as="p">{t('delete_protocol_from_app')}</StyledText>
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
