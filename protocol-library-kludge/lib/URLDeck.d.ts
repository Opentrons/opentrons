import * as React from 'react';
import type { ModuleModel, DeckSlotId } from '@opentrons/shared-data';
interface UrlData {
    labware: Record<DeckSlotId, {
        labwareType: string;
        name: string | null | undefined;
    }>;
    modules: Record<DeckSlotId, ModuleModel>;
}
export declare class URLDeck extends React.Component<{}> {
    urlData: UrlData | null;
    constructor();
    render(): JSX.Element;
}
export {};
