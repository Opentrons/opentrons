import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, POSITION_RELATIVE } from '@opentrons/components'
import { EMPTY } from '@opentrons/shared-data'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { Mount } from '../../../redux/pipettes/types'

interface PipetteOverflowMenuProps {
  pipetteName: PipetteModelSpecs['displayName'] | string
  mount: Mount
  handleChangePipette: () => void
  handleCalibrate: () => void
  handleSlideout: (isAboutSlideout: boolean) => void
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
    handleSlideout,
    isPipetteCalibrated,
  } = props

  //   TODO(jr,4/20/22): wire up disabled reasons
  return (
    <Flex position={POSITION_RELATIVE}>
      <MenuList
        buttons={
          pipetteName === EMPTY
            ? [
                <MenuItem
                  minWidth="10.6rem"
                  key={`${pipetteName}_${mount}_attach_pipette`}
                  onClick={() => handleChangePipette()}
                  data-testid={`pipetteOverflowMenu_attach_pipette_btn_${pipetteName}_${mount}`}
                >
                  {t('attach_pipette')}
                </MenuItem>,
              ]
            : [
                <MenuItem
                  minWidth="10.6rem"
                  key={`${pipetteName}_${mount}_calibrate_offset`}
                  onClick={() => handleCalibrate()}
                  data-testid={`pipetteOverflowMenu_calibrate_offset_btn_${pipetteName}_${mount}`}
                >
                  {t(
                    isPipetteCalibrated
                      ? 'recalibrate_pipette_offset'
                      : 'calibrate_pipette_offset'
                  )}
                </MenuItem>,
                <MenuItem
                  minWidth="10.6rem"
                  key={`${pipetteName}_${mount}_detach`}
                  onClick={() => handleChangePipette()}
                  data-testid={`pipetteOverflowMenu_detach_pipette_btn_${pipetteName}_${mount}`}
                >
                  {t('detach_pipette')}
                </MenuItem>,
                <MenuItem
                  minWidth="10.6rem"
                  key={`${pipetteName}_${mount}_about_pipette`}
                  onClick={() => handleSlideout(true)}
                  data-testid={`pipetteOverflowMenu_about_pipette_slideout_btn_${pipetteName}_${mount}`}
                >
                  {t('about_pipette')}
                </MenuItem>,
                <MenuItem
                  minWidth="10.6rem"
                  key={`${pipetteName}_${mount}_view_settings`}
                  onClick={() => handleSlideout(false)}
                  data-testid={`pipetteOverflowMenu_view_settings_btn_${pipetteName}_${mount}`}
                >
                  {t('view_pipette_setting')}
                </MenuItem>,
              ]
        }
      />
    </Flex>
  )
}
