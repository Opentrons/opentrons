// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import {
  FormGroup,
  InputField,
  Tooltip,
  useHoverTooltip,
  type UseHoverTooltipResult,
} from '@opentrons/components'
import { getWellsDepth } from '@opentrons/shared-data'
import {
  getIsTouchTipField,
  getIsDelayPositionField,
} from '../../../../form-types'
import { i18n } from '../../../../localization'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getDisabledFields } from '../../../../steplist/formLevel'
import stepFormStyles from '../../StepEditForm.css'
import styles from './TipPositionInput.css'
import { TipPositionModal } from './TipPositionModal'

import { getDefaultMmFromBottom } from './utils'
import type { BaseState } from '../../../../types'
import type { StepFieldName, TipOffsetFields } from '../../../../form-types'

function getLabwareFieldForPositioningField(
  fieldName: TipOffsetFields
): StepFieldName {
  const fieldMap: { [TipOffsetFields]: StepFieldName } = {
    aspirate_mmFromBottom: 'aspirate_labware',
    aspirate_touchTip_mmFromBottom: 'aspirate_labware',
    aspirate_delay_tip_position: 'aspirate_labware',
    dispense_mmFromBottom: 'dispense_labware',
    dispense_touchTip_mmFromBottom: 'dispense_labware',
    dispense_delay_tip_position: 'dispense_labware',
    mix_mmFromBottom: 'labware',
    mix_touchTip_mmFromBottom: 'labware',
  }
  return fieldMap[fieldName]
}

type OP = {| fieldName: TipOffsetFields, className?: string |}

type SP = {|
  disabled: boolean,
  mmFromBottom: number | null,
  wellDepthMm: number | null,
|}

type Props = { ...OP, ...SP }

function TipPositionInput(props: Props) {
  const [isModalOpen, setModalOpen] = React.useState(false)

  const handleOpen = () => {
    if (props.wellDepthMm) {
      setModalOpen(true)
    }
  }
  const handleClose = () => {
    setModalOpen(false)
  }

  const { disabled, fieldName, mmFromBottom, wellDepthMm } = props
  const isTouchTipField = getIsTouchTipField(props.fieldName)
  const isDelayPositionField = getIsDelayPositionField(props.fieldName)
  let value = ''
  if (wellDepthMm !== null) {
    // show default value for field in parens if no mmFromBottom value is selected
    value =
      mmFromBottom !== null
        ? mmFromBottom
        : getDefaultMmFromBottom({ fieldName, wellDepthMm })
  }

  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <>
      <Tooltip {...tooltipProps}>
        {i18n.t('tooltip.step_fields.defaults.tipPosition')}
      </Tooltip>
      <TipPositionModal
        fieldName={fieldName}
        closeModal={handleClose}
        wellDepthMm={wellDepthMm}
        mmFromBottom={mmFromBottom}
        isOpen={isModalOpen}
      />
      <Wrapper
        targetProps={targetProps}
        disabled={disabled}
        isTouchTipField={isTouchTipField}
        isDelayPositionField={isDelayPositionField}
      >
        <InputField
          className={props.className || stepFormStyles.small_field}
          readOnly
          onClick={handleOpen}
          value={String(value)}
          units={i18n.t('application.units.millimeter')}
        />
      </Wrapper>
    </>
  )
}

type WrapperProps = {|
  isTouchTipField: boolean,
  isDelayPositionField: boolean,
  children: React.Node,
  disabled: boolean,
  targetProps: $ElementType<UseHoverTooltipResult, 0>,
|}

const Wrapper = (props: WrapperProps) =>
  props.isTouchTipField || props.isDelayPositionField ? (
    <div {...props.targetProps}>{props.children}</div>
  ) : (
    <span {...props.targetProps}>
      <FormGroup
        label={i18n.t('form.step_edit_form.field.tip_position.label')}
        disabled={props.disabled}
        className={styles.well_order_input}
      >
        {props.children}
      </FormGroup>
    </span>
  )

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const rawForm = stepFormSelectors.getUnsavedForm(state)
  const { fieldName } = ownProps
  const labwareFieldName = getLabwareFieldForPositioningField(
    ownProps.fieldName
  )

  let wellDepthMm = null
  const labwareId: ?string = rawForm && rawForm[labwareFieldName]
  if (labwareId != null) {
    const labwareDef = stepFormSelectors.getLabwareEntities(state)[labwareId]
      .def

    // NOTE: only taking depth of first well in labware def, UI not currently equipped for multiple depths
    const firstWell = labwareDef.wells['A1']
    if (firstWell) wellDepthMm = getWellsDepth(labwareDef, ['A1'])
  }

  return {
    disabled: rawForm ? getDisabledFields(rawForm).has(fieldName) : false,
    wellDepthMm,
    mmFromBottom: rawForm?.[fieldName] ?? null,
  }
}

export const TipPositionField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(mapSTP)(TipPositionInput)
