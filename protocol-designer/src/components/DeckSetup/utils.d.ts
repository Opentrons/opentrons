import { LabwareDefByDefURI } from '../../labware-defs';
import { InitialDeckSetup, LabwareOnDeck } from '../../step-forms';
export interface SwapBlockedArgs {
    hoveredLabware?: LabwareOnDeck | null;
    draggedLabware?: LabwareOnDeck | null;
    modulesById: InitialDeckSetup['modules'];
    customLabwareDefs: LabwareDefByDefURI;
}
export declare const getSwapBlocked: (args: SwapBlockedArgs) => boolean;
export declare const getHasGen1MultiChannelPipette: (pipettes: InitialDeckSetup['pipettes']) => boolean;
