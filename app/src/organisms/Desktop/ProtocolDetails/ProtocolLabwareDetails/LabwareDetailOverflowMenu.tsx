import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  MenuItem,
  OverflowBtn,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { LabwareDetails } from '/app/organisms/Desktop/Labware/LabwareDetails'

import styles from './labwareretailoverflowmenu.module.css'

import type { MouseEventHandler, ReactNode } from 'react'
import type { LabwareDefAndDate } from '/app/local-resources/labware'

interface LabwareDetailOverflowMenuProps {
  labware: LabwareDefAndDate
}

export const LabwareDetailOverflowMenu = ({
  labware,
}: LabwareDetailOverflowMenuProps): ReactNode => {
  const { t } = useTranslation('protocol_details')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const [showLabwareDetailSlideout, setShowLabwareDetailSlideout] =
    useState<boolean>(false)

  const handleClickMenuItem: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(false)
    setShowLabwareDetailSlideout(true)
  }
  return (
    <div className={styles.menu_item_container}>
      <OverflowBtn onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <div className={styles.menu_item_wrapper}>
          <MenuItem onClick={handleClickMenuItem}>
            {t('go_to_labware_definition')}
          </MenuItem>
        </div>
      ) : null}
      {createPortal(
        <>
          {menuOverlay}
          {showLabwareDetailSlideout ? (
            <LabwareDetails
              labware={labware}
              onClose={() => {
                setShowLabwareDetailSlideout(false)
              }}
            />
          ) : null}
        </>,
        getTopPortalEl()
      )}
    </div>
  )
}
