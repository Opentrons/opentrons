import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { RUN_STATUS_FINISHING, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import {
  ALIGN_START,
  Banner,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { useCurrentRunStatus } from '/app/organisms/RunTimeControl'

import { Slideout } from '../../atoms/Slideout'

import type { AttachedModule } from '@opentrons/api-client'

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
  const { t } = useTranslation(['device_details', 'shared'])
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
            onCloseClick={() => {
              setShowBanner(false)
            }}
          >
            {t('firmware_update_available_period')}
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
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          data-testid={`alert_item_version_${String(module.moduleModel)}`}
        >
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {t('current_version')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {module.firmwareVersion}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="captionRegular"
            color={COLORS.grey60}
            data-testid={`alert_item_serial_number_text_${String(
              module.moduleModel
            )}`}
          >
            {t('serial_number')}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            data-testid={`alert_item_serial_${String(module.moduleModel)}`}
          >
            {module.serialNumber}
          </StyledText>
        </Flex>
      </Flex>
    </Slideout>
  )
}
