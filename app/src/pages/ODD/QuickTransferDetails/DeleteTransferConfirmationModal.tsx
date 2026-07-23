import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getQueryKey,
  useHost,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { useToaster } from '/app/organisms/ToasterOven'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface DeleteTransferConfirmationModalProps {
  transferId: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
}

export function DeleteTransferConfirmationModal({
  transferId,
  setShowDeleteConfirmationModal,
}: DeleteTransferConfirmationModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const navigate = useNavigate()
  const { makeSnackbar } = useToaster()
  const [showIcon, setShowIcon] = useState<boolean>(false)
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('delete_this_transfer'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: protocolRecord } = useProtocolQuery(transferId)
  const transferName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  const handleCloseModal = (): void => {
    setShowDeleteConfirmationModal(false)
  }
  const handleDeleteTransfer = (): void => {
    if (host != null && transferId != null) {
      setShowIcon(true)
      getProtocol(host, transferId)
        .then(
          response =>
            response.data.links?.referencingRuns.map(({ id }) => id) ?? []
        )
        .then(referencingRunIds => {
          return Promise.all(
            // eslint-disable-next-line opentrons/no-direct-mutating -- TODO(jj, 07-21-26): no direct mutations
            referencingRunIds?.map(runId => deleteRun(host, runId))
          )
        })
        // eslint-disable-next-line opentrons/no-direct-mutating -- TODO(jj, 07-21-26): no direct mutations
        .then(() => deleteProtocol(host, transferId))
        .then(() =>
          queryClient
            .invalidateQueries(getQueryKey(host, 'protocols'))
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
        )
        .then(() => {
          setShowIcon(false)
          setShowDeleteConfirmationModal(false)
          navigate('/protocols')
          makeSnackbar(t('deleted_transfer') as string)
        })
        .catch((e: Error) => {
          navigate('/protocols')
          console.error(`error deleting resources: ${e.message}`)
        })
    } else {
      console.error(
        'could not delete resources because the robot host is unknown'
      )
    }
  }
  return (
    <OddModal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex width="100%">
          <StyledText oddStyle="bodyTextRegular">
            <Trans
              t={t}
              i18nKey="will_be_deleted"
              values={{
                transferName,
              }}
            />
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            flex="1"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={handleCloseModal}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('shared:delete')}
            onClick={handleDeleteTransfer}
            iconPlacement={showIcon ? 'startIcon' : undefined}
            iconName={showIcon ? 'ot-spinner' : undefined}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
