import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, POSITION_RELATIVE } from '@opentrons/components'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { Mount } from '../../../redux/pipettes/types'

interface PipetteOverflowMenuProps {
  pipetteName: PipetteModelSpecs['displayName'] | string
  mount: Mount
  robotName: string
  handleChangePipette: () => void
  handleSlideout: (isAboutPipette: boolean) => void
}

export const PipetteOverflowMenu = (
  props: PipetteOverflowMenuProps
): JSX.Element => {
  const { t } = useTranslation('device_details')
  const {
    mount,
    pipetteName,
    robotName,
    handleChangePipette,
    handleSlideout,
  } = props
  const [
    showPipetteOverflowMenuOptions,
    setPipetteOverflowMenuOptions,
  ] = React.useState(false)

  return (
    <Flex position={POSITION_RELATIVE}>
      {showPipetteOverflowMenuOptions &&
        //  TODO(jr, 4/18/22): wire this up
        console.log(
          `add pipette calibration flow here which also  will need ${robotName}`
        )}
      <MenuList
        buttons={
          pipetteName === 'Empty'
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
                  onClick={() => setPipetteOverflowMenuOptions(true)}
                  data-testid={`pipetteOverflowMenu_calibrate_offset_btn_${pipetteName}_${mount}`}
                >
                  {t('calibrate_pipette_offset')}
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
