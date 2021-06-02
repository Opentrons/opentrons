import { $PropertyType, $Diff } from "utility-types";
import * as React from "react";
import { connect } from "react-redux";
import { Path } from "./Path";
import { selectors as stepFormSelectors } from "../../../../step-forms";
import { getDisabledPathMap } from "./getDisabledPathMap";
import type { BaseState } from "../../../../types";
type Props = React.ElementProps<typeof Path>;
type SP = {
  disabledPathMap: $PropertyType<Props, "disabledPathMap">;
};
type OP = $Diff<Props, SP>;

function mapSTP(state: BaseState, ownProps: OP): SP {
  const {
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    aspirate_wells,
    changeTip,
    dispense_wells,
    pipette,
    volume
  } = ownProps;
  const pipetteEntities = stepFormSelectors.getPipetteEntities(state);
  const disabledPathMap = getDisabledPathMap({
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    aspirate_wells,
    changeTip,
    dispense_wells,
    pipette,
    volume
  }, pipetteEntities);
  return {
    disabledPathMap
  };
}

export const PathField: React.AbstractComponent<OP> = connect<Props, OP, SP, _, _, _>(mapSTP, () => ({}))(Path);