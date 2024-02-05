import * as React from 'react';
import { FormModulesByType } from '../../../step-forms';
export interface ModuleFieldsProps {
    errors: null | string | {
        magneticModuleType?: {
            model: string;
        };
        temperatureModuleType?: {
            model: string;
        };
        thermocyclerModuleType?: {
            model: string;
        };
        heaterShakerModuleType?: {
            model: string;
        };
        magneticBlockType?: {
            model: string;
        };
    };
    touched: null | boolean | {
        magneticModuleType?: {
            model: boolean;
        };
        temperatureModuleType?: {
            model: boolean;
        };
        thermocyclerModuleType?: {
            model: boolean;
        };
        heaterShakerModuleType?: {
            model: boolean;
        };
        magneticBlockType?: {
            model: boolean;
        };
    };
    values: FormModulesByType;
    onFieldChange: (event: React.ChangeEvent) => unknown;
    onSetFieldTouched: (field: string, touched: boolean) => void;
    onBlur: (event: React.FocusEvent<HTMLSelectElement>) => unknown;
}
export declare function ModuleFields(props: ModuleFieldsProps): JSX.Element;
