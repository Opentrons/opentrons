import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  BORDERS,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { Divider } from '../../../atoms/structure'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { PipetteSettingsFieldsMap } from '@opentrons/api-client'
import type { Mount } from '../../../redux/pipettes/types'

interface PipetteOverflowMenuProps {
  pipetteSpecs: PipetteModelSpecs | null
  pipetteSettings: PipetteSettingsFieldsMap | null
  mount: Mount
  handleChangePipette: () => void
  handleDropTip: () => void
  handleAboutSlideout: () => void
  handleSettingsSlideout: () => void
  isRunActive: boolean
}

export const PipetteOverflowMenu = (
  props: PipetteOverflowMenuProps
): JSX.Element => {
  const { t, i18n } = useTranslation('device_details')
  const {
    mount,
    pipetteSpecs,
    pipetteSettings,
    handleChangePipette,
    handleDropTip,
    handleAboutSlideout,
    handleSettingsSlideout,
    isRunActive,
  } = props

  const pipetteDisplayName =
    pipetteSpecs?.displayName != null ? pipetteSpecs.displayName : t('empty')

  return (
    <Flex position={POSITION_RELATIVE}>
      <Flex
        whiteSpace="nowrap"
        zIndex={10}
        borderRadius={BORDERS.borderRadius8}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        position={POSITION_ABSOLUTE}
        backgroundColor={COLORS.white}
        top="2.6rem"
        right={`calc(50% + ${SPACING.spacing4})`}
        flexDirection={DIRECTION_COLUMN}
      >
        {pipetteDisplayName === 'Empty' ? (
          <MenuItem
            onClick={() => handleChangePipette()}
            disabled={isRunActive}
          >
            {t('attach_pipette')}
          </MenuItem>
        ) : (
          <>
            <MenuItem
              onClick={() => handleChangePipette()}
              disabled={isRunActive}
            >
              {t('detach_pipette')}
            </MenuItem>
            <MenuItem onClick={() => handleAboutSlideout()}>
              {t('about_pipette')}
            </MenuItem>
            <MenuItem onClick={() => handleDropTip()} disabled={isRunActive}>
              {i18n.format(t('drop_tips'), 'capitalize')}
            </MenuItem>
            <Divider marginY="0" />
            {pipetteSettings != null ? (
              <MenuItem
                key={`${pipetteDisplayName}_${mount}_view_settings`}
                onClick={() => handleSettingsSlideout()}
                disabled={isRunActive}
              >
                {t('view_pipette_setting')}
              </MenuItem>
            ) : null}
          </>
        )}
      </Flex>
    </Flex>
  )
}
