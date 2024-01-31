import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  getIsHeaterShakerAttached,
  updateConfigValue,
} from '../../redux/config'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ToggleButton } from '../../atoms/buttons'

import type { Dispatch } from '../../redux/types'

export function ShowHeaterShakerAttachmentModal(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const isHeaterShakerAttachmentModalVisible = useSelector(
    getIsHeaterShakerAttached
  )
  const toggleHeaterShakerModalVisibility = (): void => {
    dispatch(
      updateConfigValue(
        'modules.heaterShaker.isAttached',
        Boolean(!isHeaterShakerAttachmentModalVisible)
      )
    )
  }
  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_showHeaterShakerAttachmentModal"
        >
          {t('heater_shaker_attach_visible')}
        </StyledText>
        <StyledText as="p">{t('heater_shaker_attach_description')}</StyledText>
      </Box>
      <ToggleButton
        label="show_heater_shaker_modal"
        toggledOn={!isHeaterShakerAttachmentModalVisible}
        onClick={toggleHeaterShakerModalVisibility}
        id="AdvancedSettings_showHeaterShakerAttachmentBtn"
      />
    </Flex>
  )
}
