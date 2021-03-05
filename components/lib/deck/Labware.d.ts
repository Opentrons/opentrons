import * as React from 'react';
import type { LabwareDefinition1 } from '@opentrons/shared-data';
export interface LabwareProps {
    /** labware type, to get legacy definition from shared-data */
    labwareType?: string;
    definition?: LabwareDefinition1 | null | undefined;
}
/**
 * This is a legacy component that is only responsible
 * for visualizing a labware schema v1 definition by def or loadName
 *
 * @deprecated Use {@link LabwareRender instead}
 */
export declare class Labware extends React.Component<LabwareProps> {
    render(): JSX.Element;
}
