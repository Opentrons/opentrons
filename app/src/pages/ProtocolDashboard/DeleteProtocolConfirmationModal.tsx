import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import {
  Flex,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  Box,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal/OnDeviceDisplay'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/OnDeviceDisplay/types'

interface DeleteProtocolConfirmationModalProps {
  protocolName?: string
  protocolId?: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
}

export function DeleteProtocolConfirmationModal({
  protocolName,
  protocolId,
  setShowDeleteConfirmationModal,
}: DeleteProtocolConfirmationModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['protocol_list', 'shared'])
  const [showIcon, setShowIcon] = React.useState<boolean>(false)
  const modalHeader: ModalHeaderBaseProps = {
    title: t('should_delete_this_protocol'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow2,
  }
  const host = useHost()
  const queryClient = useQueryClient()

  const handleCloseModal = (): void => {
    setShowDeleteConfirmationModal(false)
  }
  const handleDeleteProtocol = (): void => {
    if (host != null && protocolId != null) {
      setShowIcon(true)
      getProtocol(host, protocolId)
        .then(
          response =>
            response.data.links?.referencingRuns.map(({ id }) => id) ?? []
        )
        .then(referencingRunIds => {
          return Promise.all(
            referencingRunIds?.map(runId => deleteRun(host, runId))
          )
        })
        .then(() => deleteProtocol(host, protocolId))
        .then(() =>
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) =>
              console.error(`error invalidating runs query: ${e.message}`)
            )
        )
        .then(() => {
          setShowIcon(false)
          setShowDeleteConfirmationModal(false)
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
    <Modal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing40}
        width="100%"
      >
        <Box width="100%">
          <ProtocolNameText>{protocolName}</ProtocolNameText>
          <AdditionalText>{t('delete_protocol_message')}</AdditionalText>
        </Box>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            flex="1"
            buttonType="primary"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={handleCloseModal}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('shared:delete')}
            onClick={handleDeleteProtocol}
            iconPlacement={showIcon ? 'startIcon' : undefined}
            iconName={showIcon ? 'ot-spinner' : undefined}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}

const ProtocolNameText = styled.span`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  overflow-wrap: break-word;
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.darkBlack90};
`
const AdditionalText = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.darkBlack90};
`
