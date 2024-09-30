import cx from 'classnames'
import { useSelector } from 'react-redux'
import { Icon } from '@opentrons/components'
import { getHoveredStepLabware, getHoveredStepId } from '../../../ui/steps'
import {
  getLabwareEntities,
  getSavedStepForms,
} from '../../../step-forms/selectors'
import { THERMOCYCLER_PROFILE } from '../../../constants'

import styles from './LabwareOverlays.module.css'
import type { LabwareOnDeck } from '../../../step-forms'

interface LabwareHighlightProps {
  labwareOnDeck: LabwareOnDeck
}

export const LabwareHighlight = (
  props: LabwareHighlightProps
): JSX.Element | null => {
  const { labwareOnDeck } = props
  const labwareEntities = useSelector(getLabwareEntities)
  const adapterId =
    labwareEntities[labwareOnDeck.slot] != null
      ? labwareEntities[labwareOnDeck.slot].id
      : null

  const highlighted = useSelector(getHoveredStepLabware).includes(
    adapterId ?? labwareOnDeck.id
  )

  let isTcProfile = false
  const form = useSelector(getSavedStepForms)
  const hoveredStepId = useSelector(getHoveredStepId)
  const formData = hoveredStepId ? form[hoveredStepId] : null

  if (
    formData &&
    formData.stepType === 'thermocycler' &&
    formData.thermocyclerFormType === THERMOCYCLER_PROFILE
  ) {
    isTcProfile = true
  }
  if (highlighted) {
    return (
      <div
        className={cx(styles.highlighted_border_div, {
          [styles.highlight_fill]: isTcProfile,
        })}
      >
        {isTcProfile && (
          <Icon className={styles.thermocycler_icon} name={'ot-thermocycler'} />
        )}
      </div>
    )
  }
  return null
}
