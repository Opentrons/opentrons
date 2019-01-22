// @flow
import * as React from 'react'
import {FormGroup, HoverTooltip} from '@opentrons/components'
import cx from 'classnames'

import i18n from '../../localization'
import {
  StepInputField,
  PipetteField,
  ChangeTipField,
  BlowoutLocationDropdown,
} from './formFields'
import StepField from './StepFormField'
import {CheckboxField} from '../forms'
import SourceDestFields from './SourceDestFields'
import getTooltipForField from './getTooltipForField'
import styles from './StepEditForm.css'
import type {FocusHandlers} from './index'
import type {StepType, HydratedMoveLiquidFormDataLegacy} from '../../form-types'

type MoveLiquidFormProps = {
  focusHandlers: FocusHandlers,
  stepType: StepType,
  formData: HydratedMoveLiquidFormDataLegacy,
}

// TODO: BC: IMMEDIATELY field label font weight from 800 to 600
// TODO: BC: IMMEDIATELY flowrate Type is hardcoded in SourceDestFields
// TODO: BC: IMMEDIATELY i18n all across SourceDestFields
// TODO: BC: IMMEDIATELY instead of passing path from here, put it in connect fields where needed

const MoveLiquidForm = (props: MoveLiquidFormProps) => {
  const {focusHandlers, stepType} = props
  const {path} = props.formData
  return (
    <React.Fragment>
      <div className={cx(styles.field_row, styles.start_group)}>
        <PipetteField name="pipette" stepType={stepType} {...focusHandlers} />
        {/*  TODO: Ian 2018-08-30 make volume field not be a one-off */}
        <HoverTooltip
          tooltipComponent={getTooltipForField(stepType, 'volume')}
          placement='top-start'>
          {(hoverTooltipHandlers) =>
            <FormGroup
              label='Transfer Vol:'
              className={cx(styles.volume_field, styles.small_field)}
              hoverTooltipHandlers={hoverTooltipHandlers}>
              <StepInputField name="volume" units="μL" {...focusHandlers} />
            </FormGroup>
          }
        </HoverTooltip>
      </div>

      <div className={styles.section_divider}></div>

      <SourceDestFields focusHandlers={focusHandlers} prefix="aspirate" />

      <div className={styles.section_divider}></div>

      <SourceDestFields focusHandlers={focusHandlers} prefix="dispense" />

      <div className={styles.section_divider}></div>

      <ChangeTipField stepType={stepType} name="changeTip" />

      {stepType === 'distribute' && // TODO: this should be based on path not stepType
        <StepField
          name="aspirate_disposalVol_checkbox"
          render={({value, updateValue}) => (
            <React.Fragment>
              <div className={styles.field_row}>
                <CheckboxField
                  label="Disposal Volume"
                  value={!!value}
                  onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
                {value
                  ? <div>
                    <StepInputField name="aspirate_disposalVol_volume" units="μL" {...focusHandlers} />
                  </div>
                  : null}
              </div>
              {value
                ? <div className={styles.field_row}>
                  <div className={styles.sub_select_label}>Blowout</div>
                  <BlowoutLocationDropdown
                    name="blowout_location"
                    className={styles.full_width}
                    includeSourceWell
                    {...focusHandlers} />
                </div>
                : null
              }
            </React.Fragment>
          )} />
      }

    </React.Fragment>
  )
}

export default MoveLiquidForm
