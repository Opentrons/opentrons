// @flow
import * as React from 'react'
import styles from './StepCreationButton.css'
import i18n from '../localization'

import {HoverTooltip, PrimaryButton} from '@opentrons/components'
import {stepIconsByType, type StepType} from '../form-types'

type Props = {
  onStepClick?: StepType => (event?: SyntheticEvent<*>) => mixed,
  onExpandClick?: (event?: SyntheticEvent<*>) => mixed,
  onClickAway?: (event?: SyntheticEvent<*>) => mixed,
  expanded?: boolean,
}

function StepCreationButton (props: Props) {
  const {expanded, onExpandClick, onStepClick, onClickAway} = props
  const supportedSteps = ['transfer', 'distribute', 'consolidate', 'mix', 'pause']

  const buttons = expanded && supportedSteps.map(stepType =>
    <HoverTooltip
      key={stepType}
      placement='right'
      modifiers={{preventOverflow: {enabled: false}}}
      positionFixed
      tooltipComponent={i18n.t(`tooltip.step_description.${stepType}`)}
    >
      {(hoverTooltipHandlers) => (
      <PrimaryButton
        hoverTooltipHandlers={hoverTooltipHandlers}
        onClick={onStepClick && onStepClick(stepType)}
        iconName={stepIconsByType[stepType]}
      >
        {stepType}
      </PrimaryButton>
    )}
  </HoverTooltip>
  )

  return (
    <div className={styles.step_creation_button} onMouseLeave={onClickAway}>
      <PrimaryButton
        onClick={expanded ? onClickAway : onExpandClick}
      >
        {i18n.t('button.add_step')}
      </PrimaryButton>

      <div className={styles.buttons_popover}>
        {buttons}
      </div>
    </div>
  )
}

export default StepCreationButton
