// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { FormGroup, Tooltip, useHoverTooltip } from '@opentrons/components'
import cx from 'classnames'
import { i18n } from '../../../../localization'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import ZIG_ZAG_IMAGE from '../../../../images/zig_zag_icon.svg'
import { WellOrderModal } from './WellOrderModal'

import type { BaseState } from '../../../../types'

import stepEditStyles from '../../StepEditForm.css'
import styles from './WellOrderInput.css'

type OP = {|
  className?: ?string,
  label?: string,
  prefix: 'aspirate' | 'dispense' | 'mix',
|}

type SP = {| iconClassNames: Array<string> |}

type Props = { ...OP, ...SP }

function WellOrderInput(props: Props) {
  const [isModalOpen, setModalOpen] = React.useState(false)

  const handleOpen = () => {
    setModalOpen(true)
  }
  const handleClose = () => {
    setModalOpen(false)
  }

  const [targetProps, tooltipProps] = useHoverTooltip()

  const className = cx(props.className, {
    [styles.small_field]: !props.label,
    [stepEditStyles.no_label]: !props.label,
  })

  return (
    <>
      <Tooltip {...tooltipProps}>
        {i18n.t('form.step_edit_form.field.well_order.label')}
      </Tooltip>
      <div {...targetProps}>
        <FormGroup label={props.label} className={className}>
          <WellOrderModal
            prefix={props.prefix}
            closeModal={handleClose}
            isOpen={isModalOpen}
          />
          <img
            onClick={handleOpen}
            src={ZIG_ZAG_IMAGE}
            className={cx(
              styles.well_order_icon,
              { [styles.icon_with_label]: props.label },
              ...props.iconClassNames
            )}
          />
        </FormGroup>
      </div>
    </>
  )
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = stepFormSelectors.getUnsavedForm(state)

  let iconClassNames = []
  if (formData) {
    const first = formData[`${ownProps.prefix}_wellOrder_first`]
    const second = formData[`${ownProps.prefix}_wellOrder_second`]
    iconClassNames = [styles[`${first}_first`], styles[`${second}_second`]]
  }
  return { iconClassNames }
}

export const WellOrderField = connect<Props, OP, SP, _, _, _>(mapSTP)(
  WellOrderInput
)
