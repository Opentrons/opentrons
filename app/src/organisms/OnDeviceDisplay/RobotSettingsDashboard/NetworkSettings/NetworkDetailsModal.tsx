import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { Modal } from '../../../../molecules/Modal/OnDeviceDisplay/Modal'

import type { ModalHeaderBaseProps } from '../../../../molecules/Modal/OnDeviceDisplay/types'

interface NetworkDetailsModalProps {
  setShowNetworkDetailModal: (showNetworkDetailModal: boolean) => void
  ipAddress: string
  subnetMask: string
  macAddress: string
  ssid?: string
  securityType?: string
}

export function NetworkDetailsModal({
  ssid,
  setShowNetworkDetailModal,
  ipAddress,
  securityType,
  subnetMask,
  macAddress,
}: NetworkDetailsModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const networkName = ssid != null ? ssid : t('shared:no_data')
  const modalHeader: ModalHeaderBaseProps = {
    title: securityType != null ? networkName : t('ethernet'),
    hasExitIcon: true,
    iconName: securityType != null ? 'wifi' : 'ethernet',
    iconColor: COLORS.darkBlackEnabled,
  }

  return (
    <Modal
      modalSize="medium"
      header={modalHeader}
      onOutsideClick={() => setShowNetworkDetailModal(false)}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        width="100%"
      >
        <ListItem itemName={t('ip_address')} itemValue={ipAddress} />
        {securityType != null ? (
          <ListItem itemName={t('security_type')} itemValue={securityType} />
        ) : null}
        <ListItem itemName={t('subnet_mask')} itemValue={subnetMask} />
        <ListItem itemName={t('mac_address')} itemValue={macAddress} />
      </Flex>
    </Modal>
  )
}

interface ListItemProps {
  itemName: string
  itemValue: string
}
function ListItem({ itemName, itemValue }: ListItemProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      backgroundColor={COLORS.grey3}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      borderRadius={BORDERS.size3}
    >
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {itemName}
      </StyledText>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
        {itemValue}
      </StyledText>
    </Flex>
  )
}
