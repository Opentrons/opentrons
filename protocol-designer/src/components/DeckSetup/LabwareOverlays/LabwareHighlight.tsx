import * as React from 'react'
import { Icon } from '@opentrons/components'
import cx from 'classnames'
import { useSelector } from 'react-redux'

import { THERMOCYCLER_PROFILE } from '../../../constants'
import { LabwareOnDeck } from '../../../step-forms'
import { getSavedStepForms } from '../../../step-forms/selectors'
import { getHoveredStepLabware, getHoveredStepId } from '../../../ui/steps'
import styles from './LabwareOverlays.css'

interface LabwareHighlightProps {
  labwareOnDeck: LabwareOnDeck
}

export const LabwareHighlight = (
  props: LabwareHighlightProps
): JSX.Element | null => {
  const { labwareOnDeck } = props
  const highlighted = useSelector(getHoveredStepLabware).includes(
    labwareOnDeck.id
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
