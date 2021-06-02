import * as React from "react";
import { connect } from "react-redux";
import { Splash } from "@opentrons/components";
import type { TerminalItemId } from "../steplist";
import { START_TERMINAL_ITEM_ID } from "../steplist";
import { Portal as MainPageModalPortal } from "../components/portals/MainPageModalPortal";
import { DeckSetupManager } from "../components/DeckSetupManager";
import { ConnectedFilePage } from "../containers/ConnectedFilePage";
import { SettingsPage } from "../components/SettingsPage";
import { LiquidsPage } from "../components/LiquidsPage";
import { Hints } from "../components/Hints";
import { LiquidPlacementModal } from "../components/LiquidPlacementModal";
import { LabwareSelectionModal } from "../components/LabwareSelectionModal";
import { FormManager } from "../components/FormManager";
import { TimelineAlerts } from "../components/alerts/TimelineAlerts";
import { getSelectedTerminalItemId } from "../ui/steps";
import { selectors as labwareIngredSelectors } from "../labware-ingred/selectors";
import type { Page } from "../navigation";
import { selectors } from "../navigation";
import type { BaseState } from "../types";
type Props = {
  page: Page;
  selectedTerminalItemId: TerminalItemId | null | undefined;
  ingredSelectionMode: boolean;
};

function MainPanelComponent(props: Props) {
  const {
    page,
    selectedTerminalItemId,
    ingredSelectionMode
  } = props;

  switch (page) {
    case 'file-splash':
      return <Splash />;

    case 'file-detail':
      return <ConnectedFilePage />;

    case 'liquids':
      return <LiquidsPage />;

    case 'settings-app':
      return <SettingsPage />;

    default:
      {
        const startTerminalItemSelected = selectedTerminalItemId === START_TERMINAL_ITEM_ID;
        return <>
          <MainPageModalPortal>
            <TimelineAlerts />
            <Hints />
            {startTerminalItemSelected && <LabwareSelectionModal />}
            <FormManager />
            {startTerminalItemSelected && ingredSelectionMode && <LiquidPlacementModal />}
          </MainPageModalPortal>
          <DeckSetupManager />
        </>;
      }
  }
}

function mapStateToProps(state: BaseState): Props {
  return {
    page: selectors.getCurrentPage(state),
    selectedTerminalItemId: getSelectedTerminalItemId(state),
    ingredSelectionMode: labwareIngredSelectors.getSelectedLabwareId(state) != null
  };
}

export const ConnectedMainPanel: React.AbstractComponent<{}> = connect<Props, {}, _, _, _, _>(mapStateToProps)(MainPanelComponent);