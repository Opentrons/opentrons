import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'
import { RUN_STATUS_RUNNING, RUN_STATUS_FINISHING } from '@opentrons/api-client'
import {
  Flex,
  Text,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_DECORATION_UNDERLINE,
  Btn,
  ALIGN_START,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { SecondaryButton } from '../../../atoms/Buttons'
import { Slideout } from '../../../atoms/Slideout'
import { Banner } from '../../../atoms/Banner'
import { updateModule } from '../../../redux/modules'
import { getConnectedRobotName } from '../../../redux/robot/selectors'
import { useCurrentRunStatus } from '../../RunTimeControl/hooks'

import type { State, Dispatch } from '../../../redux/types'
import type { AttachedModule } from '../../../redux/modules/types'

interface AboutModuleSlideoutProps {
  module: AttachedModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

const ALERT_ITEM_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  margin-bottom: ${SPACING.spacing4};
`

export const AboutModuleSlideout = (
  props: AboutModuleSlideoutProps
): JSX.Element | null => {
  const { module, isExpanded, onCloseClick } = props
  const { t } = useTranslation('device_details')
  const moduleName = getModuleDisplayName(module.model)
  const robotName = useSelector((state: State) => getConnectedRobotName(state))
  const runStatus = useCurrentRunStatus()
  const dispatch = useDispatch<Dispatch>()
  const [showBanner, setShowBanner] = React.useState<boolean>(true)
  const isDisabled =
    runStatus === RUN_STATUS_RUNNING || runStatus === RUN_STATUS_FINISHING

  const handleClick = (): void => {
    robotName && dispatch(updateModule(robotName, module.serial))
  }

  return (
    <Slideout
      title={t('about_module', { name: moduleName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`}
    >
      {module.hasAvailableUpdate && showBanner ? (
        <Flex paddingBottom={SPACING.spacing4}>
          <Banner
            data-testid={`alert_item_firmware_update_${module.model}`}
            css={ALERT_ITEM_STYLE}
            type="warning"
            onCloseClick={() => setShowBanner(false)}
            title={
              <>
                {t('firmware_update_available')}
                <Btn
                  textAlign={ALIGN_START}
                  paddingLeft={SPACING.spacing2}
                  fontSize={TYPOGRAPHY.fontSizeP}
                  textDecoration={TEXT_DECORATION_UNDERLINE}
                  //  TODO(jr, 3/21/22): wire up the link
                  onClick={() => console.log('firmware update!')}
                >
                  {t('view_update')}
                </Btn>
              </>
            }
          />
        </Flex>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid={`alert_item_version_${module.model}`}
          >
            <Text
              fontSize={TYPOGRAPHY.fontSizeH6}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
            >
              {t('current_version')}
            </Text>
            <Text fontSize={TYPOGRAPHY.fontSizeP} paddingTop={SPACING.spacing2}>
              {t('version', { version: module.fwVersion })}
            </Text>
          </Flex>
          {module.hasAvailableUpdate && showBanner ? (
            <SecondaryButton
              data-testid={`firmware_update_btn_${module.model}`}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              alignItems={ALIGN_CENTER}
              onClick={handleClick}
              disabled={isDisabled}
              color={COLORS.blue}
            >
              {t('link_firmware_update')}
            </SecondaryButton>
          ) : null}
        </Flex>
        <Text
          paddingTop={SPACING.spacing4}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontSize={TYPOGRAPHY.fontSizeH6}
          data-testid={`alert_item_serial_number_text_${module.model}`}
        >
          {t('serial_number')}
        </Text>
        <Text
          fontSize={TYPOGRAPHY.fontSizeH6}
          paddingTop={SPACING.spacing2}
          minHeight="34.5rem"
          data-testid={`alert_item_serial_${module.model}`}
        >
          {module.serial}
        </Text>
      </Flex>
    </Slideout>
  )
}
