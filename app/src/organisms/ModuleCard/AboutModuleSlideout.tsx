import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { RUN_STATUS_RUNNING, RUN_STATUS_FINISHING } from '@opentrons/api-client'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  ALIGN_START,
  PrimaryButton,
  LEGACY_COLORS,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { Slideout } from '../../atoms/Slideout'
import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import { useCurrentRunStatus } from '../RunTimeControl/hooks'

import type { AttachedModule } from '../../redux/modules/types'

interface AboutModuleSlideoutProps {
  module: AttachedModule
  onCloseClick: () => unknown
  isExpanded: boolean
  firmwareUpdateClick: () => unknown
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
  const [showBanner, setShowBanner] = React.useState<boolean>(true)
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
          <StyledText
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('shared:close')}
          </StyledText>
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
            onCloseClick={() => setShowBanner(false)}
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
            <StyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.grey50Enabled}
            >
              {i18n.format(t('current_version'), 'upperCase')}
            </StyledText>
            <StyledText
              as="p"
              paddingTop={SPACING.spacing4}
              paddingBottom={SPACING.spacing16}
            >
              {module.firmwareVersion}
            </StyledText>
          </Flex>
        </Flex>
        <StyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.grey50Enabled}
          data-testid={`alert_item_serial_number_text_${String(
            module.moduleModel
          )}`}
        >
          {i18n.format(t('serial_number'), 'upperCase')}
        </StyledText>
        <StyledText
          as="p"
          paddingTop={SPACING.spacing4}
          data-testid={`alert_item_serial_${String(module.moduleModel)}`}
        >
          {module.serialNumber}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
