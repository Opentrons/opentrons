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
import {
  isOT3Pipette,
  PipetteModelSpecs,
  PipetteName,
} from '@opentrons/shared-data'

import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { Divider } from '../../../atoms/structure'

import type { Mount } from '../../../redux/pipettes/types'
import type { PipetteSettingsFieldsMap } from '@opentrons/api-client'

interface PipetteOverflowMenuProps {
  pipetteSpecs: PipetteModelSpecs | null
  pipetteSettings: PipetteSettingsFieldsMap | null
  mount: Mount
  handleChangePipette: () => void
  handleCalibrate: () => void
  handleAboutSlideout: () => void
  handleSettingsSlideout: () => void
  isPipetteCalibrated: boolean
  isRunActive: boolean
}

export const PipetteOverflowMenu = (
  props: PipetteOverflowMenuProps
): JSX.Element => {
  const { t } = useTranslation('device_details')
  const {
    mount,
    pipetteSpecs,
    pipetteSettings,
    handleChangePipette,
    handleCalibrate,
    handleAboutSlideout,
    handleSettingsSlideout,
    isPipetteCalibrated,
    isRunActive,
  } = props

  const pipetteName =
    pipetteSpecs?.name != null ? pipetteSpecs.name : t('empty')
  const pipetteDisplayName =
    pipetteSpecs?.displayName != null ? pipetteSpecs.displayName : t('empty')
  const isOT3PipetteAttached = isOT3Pipette(pipetteName as PipetteName)

  return (
    <Flex position={POSITION_RELATIVE}>
      <Flex
        whiteSpace="nowrap"
        zIndex={10}
        borderRadius="4px 4px 0px 0px"
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        position={POSITION_ABSOLUTE}
        backgroundColor={COLORS.white}
        top="2.6rem"
        right={`calc(50% + ${SPACING.spacing4})`}
        flexDirection={DIRECTION_COLUMN}
      >
        {pipetteDisplayName === 'Empty' ? (
          <MenuItem
            key={`${String(pipetteDisplayName)}_${mount}_attach_pipette`}
            onClick={() => handleChangePipette()}
            disabled={isRunActive}
            data-testid={`pipetteOverflowMenu_attach_pipette_btn_${String(
              pipetteDisplayName
            )}_${mount}`}
          >
            {t('attach_pipette')}
          </MenuItem>
        ) : (
          <>
            {isOT3PipetteAttached && (
              <MenuItem
                key={`${pipetteDisplayName}_${mount}_calibrate_offset`}
                onClick={() => handleCalibrate()}
                disabled={isRunActive}
                data-testid={`pipetteOverflowMenu_calibrate_offset_btn_${pipetteDisplayName}_${mount}`}
              >
                {t(
                  isPipetteCalibrated
                    ? 'recalibrate_pipette'
                    : 'calibrate_pipette'
                )}
              </MenuItem>
            )}
            <MenuItem
              key={`${String(pipetteDisplayName)}_${mount}_detach`}
              onClick={() => handleChangePipette()}
              disabled={isRunActive}
              data-testid={`pipetteOverflowMenu_detach_pipette_btn_${String(
                pipetteDisplayName
              )}_${mount}`}
            >
              {t('detach_pipette')}
            </MenuItem>
            <MenuItem
              key={`${String(pipetteDisplayName)}_${mount}_about_pipette`}
              onClick={() => handleAboutSlideout()}
              data-testid={`pipetteOverflowMenu_about_pipette_slideout_btn_${pipetteDisplayName}_${mount}`}
            >
              {t('about_pipette')}
            </MenuItem>
            <Divider marginY="0" />
            {!isOT3PipetteAttached && pipetteSettings != null ? (
              <MenuItem
                key={`${String(pipetteDisplayName)}_${mount}_view_settings`}
                onClick={() => handleSettingsSlideout()}
                data-testid={`pipetteOverflowMenu_view_settings_btn_${String(
                  pipetteDisplayName
                )}_${mount}`}
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
