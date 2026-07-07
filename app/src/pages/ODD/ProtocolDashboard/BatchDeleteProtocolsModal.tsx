import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { useToaster } from '/app/organisms/ToasterOven'

import { useDeleteProtocols } from './useDeleteProtocols'

import type { ProtocolResource } from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface BatchDeleteProtocolsModalProps {
  protocols: ProtocolResource[]
  onClose: () => void
}

export function BatchDeleteProtocolsModal({
  protocols,
  onClose,
}: BatchDeleteProtocolsModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['protocol_list', 'shared'])
  const { makeSnackbar } = useToaster()
  const { deleteProtocols, isDeleting } = useDeleteProtocols()

  const protocolCount = protocols.length
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('delete_n_protocols', { count: protocolCount }),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  const handleDeleteProtocols = (): void => {
    deleteProtocols(protocols.map(protocol => protocol.id))
      .then(({ failedIds }) => {
        const successCount = protocolCount - failedIds.length
        if (failedIds.length === 0) {
          makeSnackbar(
            t('protocols_deleted', { count: successCount }) as string
          )
        } else {
          makeSnackbar(
            t('some_protocols_failed_to_delete', {
              success: successCount,
              total: protocolCount,
            }) as string
          )
        }
        onClose()
      })
      .catch((e: Error) => {
        console.error(`error deleting protocols: ${e.message}`)
        onClose()
      })
  }

  return (
    <OddModal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Box width="100%">
          <ProtocolNamesList>
            {protocols.map(protocol => (
              <ProtocolNameText key={protocol.id}>
                {protocol.metadata.protocolName ?? protocol.files[0]?.name}
              </ProtocolNameText>
            ))}
          </ProtocolNamesList>
          <AdditionalText>{t('delete_protocol_message')}</AdditionalText>
        </Box>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            flex="1"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={onClose}
            disabled={isDeleting}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('shared:delete')}
            onClick={handleDeleteProtocols}
            iconPlacement={isDeleting ? 'startIcon' : undefined}
            iconName={isDeleting ? 'ot-spinner' : undefined}
            disabled={isDeleting}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}

const ProtocolNamesList = styled.ul`
  margin: 0 0 ${SPACING.spacing8} 0;
  padding: 0;
  list-style: none;
  max-height: 12rem;
  overflow-y: auto;
`

const ProtocolNameText = styled.li`
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.grey60};
`

const AdditionalText = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.grey60};
`
