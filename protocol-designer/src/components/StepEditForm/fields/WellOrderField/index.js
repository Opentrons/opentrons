// @flow
import * as React from 'react'
import {
  Text,
  FormGroup,
  Tooltip,
  useHoverTooltip,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
} from '@opentrons/components'
import cx from 'classnames'
import { i18n } from '../../../../localization'
import ZIG_ZAG_IMAGE from '../../../../images/zig_zag_icon.svg'
import { WellOrderModal } from './WellOrderModal'
import stepEditStyles from '../../StepEditForm.css'
import styles from './WellOrderInput.css'
import type { FieldProps } from '../../types'
import type { WellOrderOption } from '../../../../form-types'

type Props = {|
  className?: ?string,
  label?: string,
  prefix: 'aspirate' | 'dispense' | 'mix',
  firstValue: ?WellOrderOption,
  secondValue: ?WellOrderOption,
  updateFirstWellOrder: $PropertyType<FieldProps, 'updateValue'>,
  updateSecondWellOrder: $PropertyType<FieldProps, 'updateValue'>,
|}

export const WellOrderField = (props: Props): React.Node => {
  const {
    firstValue,
    secondValue,
    updateFirstWellOrder,
    updateSecondWellOrder,
  } = props
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
    const iconClassNames = []
    if (firstValue) {
      iconClassNames.push(styles[`${firstValue}_first`])
    }
    if (secondValue) {
      iconClassNames.push(styles[`${secondValue}_second`])
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
            updateValues={updateValues}
            firstValue={firstValue}
            secondValue={secondValue}
          />
          {firstValue != null && secondValue != null ? (
            <img
              onClick={handleOpen}
              src={ZIG_ZAG_IMAGE}
              className={cx(
                styles.well_order_icon,
                { [styles.icon_with_label]: props.label },
                getIconClassNames()
              )}
            />
          ) : (
            <Text
              onClick={handleOpen}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              fontSize={FONT_SIZE_BODY_1}
              paddingTop="0.5rem"
            >
              {i18n.t('form.step_edit_form.field.well_order.mixed')}
            </Text>
          )}
        </FormGroup>
      </div>
    </>
  )
}
