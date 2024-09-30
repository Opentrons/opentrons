import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { RUN_STATUS_RUNNING, RUN_STATUS_FINISHING } from '@opentrons/api-client'
import {
  ALIGN_START,
  Banner,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { Slideout } from '../../atoms/Slideout'
import { useCurrentRunStatus } from '/app/organisms/RunTimeControl'

import type { AttachedModule } from '/app/redux/modules/types'

interface AboutModuleSlideoutProps {
  module: AttachedModule
  onCloseClick: () => void
  isExpanded: boolean
  firmwareUpdateClick: () => void
}

const ALERT_ITEM_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  margin-bottom: ${SPACING.spacing16};
`

export const AboutModuleSlideout = (
  props: AboutModuleSlideoutProps
): JSX.Element | null => {
  const { module, isExpanded, onCloseClick, firmwareUpdateClick } = props
  const { i18n, t } = useTranslation(['device_details', 'shared'])
  const moduleName = getModuleDisplayName(module.moduleModel)
  const runStatus = useCurrentRunStatus()
  const [showBanner, setShowBanner] = useState<boolean>(true)
  const isDisabled =
    runStatus === RUN_STATUS_RUNNING || runStatus === RUN_STATUS_FINISHING

  const handleFirmwareUpdateClick = (): void => {
    firmwareUpdateClick()
    onCloseClick()
  }

  return (
    <Slideout
      title={t('about_module', { name: moduleName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          width="100%"
          onClick={onCloseClick}
          data-testid={`AboutModuleSlideout_btn_${module.serialNumber}`}
        >
          <LegacyStyledText
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('shared:close')}
          </LegacyStyledText>
        </PrimaryButton>
      }
    >
      {module.hasAvailableUpdate && !isDisabled && showBanner ? (
        <Flex paddingBottom={SPACING.spacing16}>
          <Banner
            data-testid={`alert_item_firmware_update_${String(
              module.moduleModel
            )}`}
            css={ALERT_ITEM_STYLE}
            type="warning"
            onCloseClick={() => {
              setShowBanner(false)
            }}
          >
            {t('firmware_update_available')}
            <Btn
              textAlign={ALIGN_START}
              paddingLeft={SPACING.spacing4}
              fontSize={TYPOGRAPHY.fontSizeP}
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              onClick={handleFirmwareUpdateClick}
            >
              {t('update_now')}
            </Btn>
          </Banner>
        </Flex>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid={`alert_item_version_${String(module.moduleModel)}`}
          >
            <LegacyStyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.grey60}
            >
              {i18n.format(t('current_version'), 'upperCase')}
            </LegacyStyledText>
            <LegacyStyledText
              as="p"
              paddingTop={SPACING.spacing4}
              paddingBottom={SPACING.spacing16}
            >
              {module.firmwareVersion}
            </LegacyStyledText>
          </Flex>
        </Flex>
        <LegacyStyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.grey60}
          data-testid={`alert_item_serial_number_text_${String(
            module.moduleModel
          )}`}
        >
          {i18n.format(t('serial_number'), 'upperCase')}
        </LegacyStyledText>
        <LegacyStyledText
          as="p"
          paddingTop={SPACING.spacing4}
          data-testid={`alert_item_serial_${String(module.moduleModel)}`}
        >
          {module.serialNumber}
        </LegacyStyledText>
      </Flex>
    </Slideout>
  )
}
