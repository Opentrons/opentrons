import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { OddModal } from '/app/molecules/OddModal'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

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
  const modalHeader: OddModalHeaderBaseProps = {
    title: securityType != null ? networkName : t('ethernet'),
    hasExitIcon: true,
    iconName: securityType != null ? 'wifi' : 'ethernet',
    iconColor: COLORS.black90,
  }

  return (
    <OddModal
      modalSize="medium"
      header={modalHeader}
      onOutsideClick={() => {
        setShowNetworkDetailModal(false)
      }}
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
    </OddModal>
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
      backgroundColor={COLORS.grey40}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      borderRadius={BORDERS.borderRadius8}
    >
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {itemName}
      </LegacyStyledText>
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
        {itemValue}
      </LegacyStyledText>
    </Flex>
  )
}
