import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { useToaster } from '/app/organisms/ToasterOven'

import styles from './batchdeleteprotocolsmodal.module.css'
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
      <div className={styles.modal_content}>
        <div className={styles.protocol_summary}>
          <ul
            className={styles.protocol_names}
            data-testid="BatchDeleteProtocolsModal_protocolNames"
          >
            {protocols.map(protocol => (
              <li className={styles.protocol_name} key={protocol.id}>
                {protocol.metadata.protocolName ?? protocol.files[0]?.name}
              </li>
            ))}
          </ul>
          <span className={styles.additional_text}>
            {t('delete_selected_protocol_message', { count: protocolCount })}
          </span>
        </div>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
          flex="none"
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
      </div>
    </OddModal>
  )
}
