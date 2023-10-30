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
  isFlexPipette,
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
  handleDropTip: () => void
  handleCalibrate: () => void
  handleAboutSlideout: () => void
  handleSettingsSlideout: () => void
  isPipetteCalibrated: boolean
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
  const isFlexPipetteAttached = isFlexPipette(pipetteName as PipetteName)

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
            onClick={() => handleChangePipette()}
            disabled={isRunActive}
          >
            {t('attach_pipette')}
          </MenuItem>
        ) : (
          <>
            {isFlexPipetteAttached ? (
              <MenuItem
                onClick={() => handleCalibrate()}
                disabled={isRunActive}
              >
                {t(
                  isPipetteCalibrated
                    ? 'recalibrate_pipette'
                    : 'calibrate_pipette'
                )}
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => handleChangePipette()}
              disabled={isRunActive}
            >
              {t('detach_pipette')}
            </MenuItem>
            <MenuItem onClick={() => handleAboutSlideout()}>
              {t('about_pipette')}
            </MenuItem>
            <MenuItem onClick={() => handleDropTip()}>
              {i18n.format(t('drop_tips'), 'capitalize')}
            </MenuItem>
            <Divider marginY="0" />
            {!isFlexPipetteAttached && pipetteSettings != null ? (
              <MenuItem
                key={`${pipetteDisplayName}_${mount}_view_settings`}
                onClick={() => handleSettingsSlideout()}
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
