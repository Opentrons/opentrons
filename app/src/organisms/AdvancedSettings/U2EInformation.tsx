import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import {
  getU2EAdapterDevice,
  getU2EWindowsDriverStatus,
  OUTDATED,
} from '../../redux/system-info'

import type { State } from '../../redux/types'

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
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_u2eInformation"
        >
          {t('usb_to_ethernet_adapter_info')}
        </StyledText>
        <StyledText as="p">
          {t('usb_to_ethernet_adapter_info_description')}
        </StyledText>
        {driverOutdated && (
          <Banner type="warning" marginTop={SPACING.spacing16}>
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
              <StyledText as="p" color={COLORS.black90}>
                {t('usb_to_ethernet_adapter_toast_message')}
              </StyledText>
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
          <StyledText as="p" marginTop={SPACING.spacing16}>
            {t('usb_to_ethernet_not_connected')}
          </StyledText>
        ) : (
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginTop={SPACING.spacing16}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing16}
            >
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('usb_to_ethernet_adapter_description')}
              </StyledText>
              <StyledText as="p">{device?.productName}</StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing16}
            >
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('usb_to_ethernet_adapter_manufacturer')}
              </StyledText>
              <StyledText as="p">{device?.manufacturerName}</StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing16}
            >
              <StyledText css={TYPOGRAPHY.pSemiBold}>
                {t('usb_to_ethernet_adapter_driver_version')}
              </StyledText>
              <StyledText as="p">
                {device?.windowsDriverVersion != null
                  ? device.windowsDriverVersion
                  : t('usb_to_ethernet_adapter_no_driver_version')}
              </StyledText>
            </Flex>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}
