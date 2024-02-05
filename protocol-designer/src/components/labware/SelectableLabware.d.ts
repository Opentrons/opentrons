import * as React from 'react';
import { WellGroup } from '@opentrons/components';
import { SingleLabware } from './SingleLabware';
import type { ContentsByWell } from '../../labware-ingred/types';
import type { WellIngredientNames } from '../../steplist/types';
import type { NozzleType } from '../../types';
export interface Props {
    labwareProps: Omit<React.ComponentProps<typeof SingleLabware>, 'selectedWells'>;
    /** array of primary wells. Overrides labwareProps.selectedWells */
    selectedPrimaryWells: WellGroup;
    selectWells: (wellGroup: WellGroup) => unknown;
    deselectWells: (wellGroup: WellGroup) => unknown;
    updateHighlightedWells: (wellGroup: WellGroup) => unknown;
    nozzleType: NozzleType | null;
    ingredNames: WellIngredientNames;
    wellContents: ContentsByWell;
}
export declare const SelectableLabware: (props: Props) => JSX.Element;
