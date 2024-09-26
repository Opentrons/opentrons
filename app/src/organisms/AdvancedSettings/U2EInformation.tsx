import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Banner,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  getU2EAdapterDevice,
  getU2EWindowsDriverStatus,
  OUTDATED,
} from '/app/redux/system-info'

import type { State } from '/app/redux/types'

const REALTEK_URL = 'https://www.realtek.com/en/'

export function U2EInformation(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const device = useSelector(getU2EAdapterDevice)
  const driverOutdated = useSelector((state: State) => {
    const status = getU2EWindowsDriverStatus(state)
    return status === OUTDATED
  })

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box>
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_u2eInformation"
        >
          {t('usb_to_ethernet_adapter_info')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('usb_to_ethernet_adapter_info_description')}
        </LegacyStyledText>
        {driverOutdated && (
          <Banner type="warning" marginTop={SPACING.spacing16}>
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
              <LegacyStyledText as="p" color={COLORS.black90}>
                {t('usb_to_ethernet_adapter_toast_message')}
              </LegacyStyledText>
              <Link
                external
                href={REALTEK_URL}
                css={TYPOGRAPHY.pRegular}
                color={COLORS.black90}
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                id="AdvancedSettings_realtekLink"
              >
                {t('usb_to_ethernet_adapter_link')}
              </Link>
            </Flex>
          </Banner>
        )}
        {device === null ? (
          <LegacyStyledText as="p" marginTop={SPACING.spacing16}>
            {t('usb_to_ethernet_not_connected')}
          </LegacyStyledText>
        ) : (
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginTop={SPACING.spacing16}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing16}
            >
              <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                {t('usb_to_ethernet_adapter_description')}
              </LegacyStyledText>
              <LegacyStyledText as="p">
                {device?.productName ?? t('usb_to_ethernet_unknown_product')}
              </LegacyStyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing16}
            >
              <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                {t('usb_to_ethernet_adapter_manufacturer')}
              </LegacyStyledText>
              <LegacyStyledText as="p">
                {device?.manufacturerName ??
                  t('usb_to_ethernet_unknown_manufacturer')}
              </LegacyStyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing16}
            >
              <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                {t('usb_to_ethernet_adapter_driver_version')}
              </LegacyStyledText>
              <LegacyStyledText as="p">
                {device?.windowsDriverVersion != null
                  ? device.windowsDriverVersion
                  : t('usb_to_ethernet_adapter_no_driver_version')}
              </LegacyStyledText>
            </Flex>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}
