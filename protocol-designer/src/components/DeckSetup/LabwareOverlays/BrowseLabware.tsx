import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { useDispatch } from 'react-redux'
import { Icon } from '@opentrons/components'
import { drillDownOnLabware } from '../../../labware-ingred/actions'
import { resetScrollElements } from '../../../ui/steps/utils'
import styles from './LabwareOverlays.css'

import type { LabwareEntity } from '@opentrons/step-generation'
import type { LabwareOnDeck } from '../../../step-forms'

interface Props {
  labwareOnDeck: LabwareOnDeck | LabwareEntity
}

export function BrowseLabware(props: Props): JSX.Element | null {
  const { t } = useTranslation('deck')
  const { labwareOnDeck } = props
  const dispatch = useDispatch()

  const drillDown = (): void => {
    resetScrollElements()
    dispatch(drillDownOnLabware(labwareOnDeck.id))
  }

  if (
    props.labwareOnDeck.def.parameters.isTiprack ||
    props.labwareOnDeck.def.allowedRoles?.includes('adapter')
  )
    return null
  return (
    <div className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <a className={styles.overlay_button} onClick={drillDown}>
        <Icon className={styles.overlay_icon} name="water" />
        {t('overlay.browse.view_liquids')}
      </a>
    </div>
  )
}
