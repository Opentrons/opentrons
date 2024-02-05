import * as React from 'react';
import { RobotType } from '@opentrons/shared-data';
import { FormPipettesByMount } from '../../../step-forms';
export interface Props {
    initialTabIndex?: number;
    values: FormPipettesByMount;
    errors: null | string | {
        left?: {
            tiprackDefURI: string;
        };
        right?: {
            tiprackDefURI: string;
        };
    };
    touched: null | boolean | {
        left?: {
            tiprackDefURI: boolean;
        };
        right?: {
            tiprackDefURI: boolean;
        };
    };
    onFieldChange: (event: React.ChangeEvent<HTMLSelectElement>) => unknown;
    onSetFieldValue: (field: string, value: string | null) => void;
    onSetFieldTouched: (field: string, touched: boolean) => void;
    onBlur: (event: React.FocusEvent<HTMLSelectElement>) => unknown;
    robotType: RobotType;
}
export declare function PipetteFields(props: Props): JSX.Element;
