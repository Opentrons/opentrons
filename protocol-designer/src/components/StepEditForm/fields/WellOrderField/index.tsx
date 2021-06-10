// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  FormGroup,
  Text,
  Tooltip,
  useHoverTooltip,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  C_LIGHT_GRAY,
} from '@opentrons/components'
import cx from 'classnames'
import { i18n } from '../../../../localization'
import ZIG_ZAG_IMAGE from '../../../../images/zig_zag_icon.svg'
import { WellOrderModal } from './WellOrderModal'
import stepEditStyles from '../../StepEditForm.css'
import styles from './WellOrderInput.css'
import { FieldProps } from '../../types'
import { WellOrderOption } from '../../../../form-types'

type Props = {
  className: string | null | undefined
  label?: string
  prefix: 'aspirate' | 'dispense' | 'mix'
  firstValue: WellOrderOption | null | undefined
  secondValue: WellOrderOption | null | undefined
  firstName: string
  secondName: string
  updateFirstWellOrder: $PropertyType<FieldProps, 'updateValue'>
  updateSecondWellOrder: $PropertyType<FieldProps, 'updateValue'>
}

export const WellOrderField = (props: Props): JSX.Element => {
  const {
    firstValue,
    secondValue,
    firstName,
    secondName,
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

  const mixedWellOrderStyles = css`
    font-weight: ${FONT_WEIGHT_SEMIBOLD};
    font-size: ${FONT_SIZE_BODY_1};
    padding-top: 0.5rem;
    padding-bottom: 0.325rem;

    &:hover {
      background-color: ${C_LIGHT_GRAY};
    }
  `

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
            firstName={firstName}
            secondName={secondName}
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
              id={`WellOrderField_button_${props.prefix}`}
              data-test={`WellOrderField_button_${String(firstValue)}_${String(
                secondValue
              )}`}
            />
          ) : (
            <Text
              onClick={handleOpen}
              css={mixedWellOrderStyles}
              id={`WellOrderField_button_${props.prefix}`}
              data-test={`WellOrderField_button_${String(firstValue)}_${String(
                secondValue
              )}`}
            >
              {i18n.t('form.step_edit_form.field.well_order.unknown')}
            </Text>
          )}
        </FormGroup>
      </div>
    </>
  )
}
