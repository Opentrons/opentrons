import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { Divider } from '../../../atoms/structure'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { Mount } from '../../../redux/pipettes/types'

interface PipetteOverflowMenuProps {
  pipetteName: PipetteModelSpecs['displayName'] | string
  mount: Mount
  handleChangePipette: () => void
  handleCalibrate: () => void
  handleAboutSlideout: () => void
  handleSettingsSlideout: () => void
  isPipetteCalibrated: boolean
}

export const PipetteOverflowMenu = (
  props: PipetteOverflowMenuProps
): JSX.Element => {
  const { t } = useTranslation('device_details')
  const {
    mount,
    pipetteName,
    handleChangePipette,
    handleCalibrate,
    handleAboutSlideout,
    handleSettingsSlideout,
    isPipetteCalibrated,
  } = props

  return (
    <Flex position={POSITION_RELATIVE}>
      <Flex
        width="12rem"
        zIndex={10}
        borderRadius="4px 4px 0px 0px"
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        position={POSITION_ABSOLUTE}
        backgroundColor={COLORS.white}
        top="2.6rem"
        right={`calc(50% + ${SPACING.spacing2})`}
        flexDirection={DIRECTION_COLUMN}
      >
        {pipetteName === 'Empty' ? (
          <MenuItem
            key={`${pipetteName}_${mount}_attach_pipette`}
            onClick={() => handleChangePipette()}
            data-testid={`pipetteOverflowMenu_attach_pipette_btn_${pipetteName}_${mount}`}
          >
            {t('attach_pipette')}
          </MenuItem>
        ) : (
          <>
            <MenuItem
              key={`${pipetteName}_${mount}_calibrate_offset`}
              onClick={() => handleCalibrate()}
              data-testid={`pipetteOverflowMenu_calibrate_offset_btn_${pipetteName}_${mount}`}
            >
              {t(
                isPipetteCalibrated
                  ? 'recalibrate_pipette_offset'
                  : 'calibrate_pipette_offset'
              )}
            </MenuItem>
            <MenuItem
              key={`${pipetteName}_${mount}_detach`}
              onClick={() => handleChangePipette()}
              data-testid={`pipetteOverflowMenu_detach_pipette_btn_${pipetteName}_${mount}`}
            >
              {t('detach_pipette')}
            </MenuItem>
            <MenuItem
              key={`${pipetteName}_${mount}_about_pipette`}
              onClick={() => handleAboutSlideout()}
              data-testid={`pipetteOverflowMenu_about_pipette_slideout_btn_${pipetteName}_${mount}`}
            >
              {t('about_pipette')}
            </MenuItem>
            <Divider marginY="0" />
            <MenuItem
              key={`${pipetteName}_${mount}_view_settings`}
              onClick={() => handleSettingsSlideout()}
              data-testid={`pipetteOverflowMenu_view_settings_btn_${pipetteName}_${mount}`}
            >
              {t('view_pipette_setting')}
            </MenuItem>
          </>
        )}
      </Flex>
    </Flex>
  )
}
