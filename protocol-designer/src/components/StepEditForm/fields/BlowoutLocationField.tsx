import * as React from "react";
import { useSelector } from "react-redux";
import type { Options } from "@opentrons/components";
import { DropdownField } from "@opentrons/components";
import cx from "classnames";
import { selectors as uiLabwareSelectors } from "../../../ui/labware";
import styles from "../StepEditForm.css";
import type { FieldProps } from "../types";
type BlowoutLocationDropdownProps = FieldProps & {
  className?: string;
  options: Options;
};
export const BlowoutLocationField = (props: BlowoutLocationDropdownProps): React.ReactNode => {
  const {
    className,
    disabled,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    value
  } = props;
  const disposalLabwareOptions = useSelector(uiLabwareSelectors.getDisposalLabwareOptions);
  const options = [...disposalLabwareOptions, ...props.options];
  return <DropdownField className={cx(styles.large_field, className)} options={options} disabled={disabled} id={'BlowoutLocationField_dropdown'} onBlur={onFieldBlur} onFocus={onFieldFocus} value={value ? String(value) : null} onChange={(e: React.SyntheticEvent<HTMLSelectElement>) => {
    updateValue(e.currentTarget.value);
  }} />;
};