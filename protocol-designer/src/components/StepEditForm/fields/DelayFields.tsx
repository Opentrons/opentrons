import * as React from "react";
import { i18n } from "../../../localization";
import { TextField } from "./TextField";
import { CheckboxRowField } from "./CheckboxRowField";
import { TipPositionField } from "./TipPositionField";
import styles from "../StepEditForm.css";
import type { FieldPropsByName } from "../types";
import type { StepFieldName } from "../../../form-types";
export type DelayFieldProps = {
  checkboxFieldName: StepFieldName;
  // TODO(IL, 2021-03-03): strictly, could be DelayCheckboxFields!
  labwareId: string | null | undefined;
  propsForFields: FieldPropsByName;
  secondsFieldName: StepFieldName;
  // TODO(IL, 2021-03-03): strictly, could be DelaySecondFields!
  tipPositionFieldName?: StepFieldName; // TODO(IL, 2021-03-03): strictly, could be TipOffsetFields!

};
export const DelayFields = (props: DelayFieldProps): React.ReactNode => {
  const {
    checkboxFieldName,
    secondsFieldName,
    tipPositionFieldName,
    propsForFields,
    labwareId
  } = props;
  return <CheckboxRowField {...propsForFields[checkboxFieldName]} label={i18n.t('form.step_edit_form.field.delay.label')} className={styles.small_field}>
      <TextField {...propsForFields[secondsFieldName]} className={styles.small_field} units={i18n.t('application.units.seconds')} />
      {tipPositionFieldName && <TipPositionField {...propsForFields[tipPositionFieldName]} labwareId={labwareId} />}
    </CheckboxRowField>;
};