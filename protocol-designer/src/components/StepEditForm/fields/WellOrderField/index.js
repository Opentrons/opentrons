// @flow
import * as React from 'react'
import { FormGroup, Tooltip, useHoverTooltip } from '@opentrons/components'
import cx from 'classnames'
import { i18n } from '../../../../localization'
import ZIG_ZAG_IMAGE from '../../../../images/zig_zag_icon.svg'
import { WellOrderModal } from './WellOrderModal'
import stepEditStyles from '../../StepEditForm.css'
import styles from './WellOrderInput.css'
import type { FormData } from '../../../../form-types'
import type { FieldProps } from '../../types'

type Props = {|
  className?: ?string,
  label?: string,
  prefix: 'aspirate' | 'dispense' | 'mix',
  formData: FormData,
  updateFirstWellOrder: $PropertyType<FieldProps, 'updateValue'>,
  updateSecondWellOrder: $PropertyType<FieldProps, 'updateValue'>,
|}

export const WellOrderField = (props: Props): React.Node => {
  const { formData, updateFirstWellOrder, updateSecondWellOrder } = props
  const [isModalOpen, setModalOpen] = React.useState(false)

  const handleOpen = () => {
    setModalOpen(true)
  }
  const handleClose = () => {
    setModalOpen(false)
  }

  const updateValues = (firstValue, secondValue) => {
    updateFirstWellOrder(firstValue)
    updateSecondWellOrder(secondValue)
  }

  const getIconClassNames = () => {
    let iconClassNames = []
    if (formData) {
      const first = formData[`${props.prefix}_wellOrder_first`]
      const second = formData[`${props.prefix}_wellOrder_second`]
      iconClassNames = [styles[`${first}_first`], styles[`${second}_second`]]
    }
    return iconClassNames
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
            formData={formData}
            updateValues={updateValues}
          />
          <img
            onClick={handleOpen}
            src={ZIG_ZAG_IMAGE}
            className={cx(
              styles.well_order_icon,
              { [styles.icon_with_label]: props.label },
              getIconClassNames()
            )}
          />
        </FormGroup>
      </div>
    </>
  )
}
