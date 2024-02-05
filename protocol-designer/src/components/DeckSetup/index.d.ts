import { RobotWorkSpaceRenderProps } from '@opentrons/components';
import { InitialDeckSetup } from '../../step-forms';
import { TerminalItemId } from '../../steplist';
import type { CutoutId, DeckDefinition, RobotType } from '@opentrons/shared-data';
export declare const DECK_LAYER_BLOCKLIST: string[];
interface ContentsProps {
    getRobotCoordsFromDOMCoords: RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords'];
    activeDeckSetup: InitialDeckSetup;
    selectedTerminalItemId?: TerminalItemId | null;
    showGen1MultichannelCollisionWarnings: boolean;
    deckDef: DeckDefinition;
    robotType: RobotType;
    stagingAreaCutoutIds: CutoutId[];
    trashSlot: string | null;
}
export declare const DeckSetupContents: (props: ContentsProps) => JSX.Element;
export declare const DeckSetup: () => JSX.Element;
export {};
