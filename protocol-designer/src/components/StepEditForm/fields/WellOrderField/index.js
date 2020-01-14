// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { HoverTooltip, FormGroup } from '@opentrons/components'
import cx from 'classnames'
import i18n from '../../../../localization'
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

type WellOrderInputState = { isModalOpen: boolean }

class WellOrderInput extends React.Component<Props, WellOrderInputState> {
  state: WellOrderInputState = { isModalOpen: false }

  handleOpen = () => {
    this.setState({ isModalOpen: true })
  }
  handleClose = () => {
    this.setState({ isModalOpen: false })
  }

  render() {
    const className = cx(this.props.className, {
      [styles.small_field]: !this.props.label,
      [stepEditStyles.no_label]: !this.props.label,
    })
    return (
      <HoverTooltip
        tooltipComponent={i18n.t('form.step_edit_form.field.well_order.label')}
      >
        {hoverTooltipHandlers => (
          <div {...hoverTooltipHandlers}>
            <FormGroup label={this.props.label} className={className}>
              <WellOrderModal
                prefix={this.props.prefix}
                closeModal={this.handleClose}
                isOpen={this.state.isModalOpen}
              />
              <img
                onClick={this.handleOpen}
                src={ZIG_ZAG_IMAGE}
                className={cx(
                  styles.well_order_icon,
                  { [styles.icon_with_label]: this.props.label },
                  ...this.props.iconClassNames
                )}
              />
            </FormGroup>
          </div>
        )}
      </HoverTooltip>
    )
  }
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
