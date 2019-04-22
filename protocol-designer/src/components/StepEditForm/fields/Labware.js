// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { DropdownField, type Options } from '@opentrons/components'
import cx from 'classnames'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { BaseState } from '../../../types'
import type { FocusHandlers } from '../types'
import styles from '../StepEditForm.css'
import StepField from './FieldConnector'

type OP = {|
  ...$Exact<FocusHandlers>,
  name: StepFieldName,
  className?: string,
|}

type SP = {| labwareOptions: Options |}

type Props = { ...OP, ...SP }

const LabwareFieldSTP = (state: BaseState): SP => ({
  labwareOptions: uiLabwareSelectors.getLabwareOptions(state),
})

const LabwareField = connect<Props, OP, SP, _, _, _>(LabwareFieldSTP)(
  (props: Props) => {
    const {
      labwareOptions,
      name,
      className,
      focusedField,
      dirtyFields,
      onFieldBlur,
      onFieldFocus,
    } = props
    return (
      // TODO: BC abstract e.currentTarget.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
      <StepField
        name={name}
        focusedField={focusedField}
        dirtyFields={dirtyFields}
        render={({ value, updateValue, errorToShow }) => {
          // blank out the dropdown if labware id does not exist
          const availableLabwareIds = labwareOptions.map(opt => opt.value)
          const fieldValue = availableLabwareIds.includes(value)
            ? String(value)
            : null
          return (
            <DropdownField
              error={errorToShow}
              className={cx(styles.large_field, className)}
              options={labwareOptions}
              onBlur={() => {
                onFieldBlur(name)
              }}
              onFocus={() => {
                onFieldFocus(name)
              }}
              value={fieldValue}
              onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
                updateValue(e.currentTarget.value)
              }}
            />
          )
        }}
      />
    )
  }
)

export default LabwareField
