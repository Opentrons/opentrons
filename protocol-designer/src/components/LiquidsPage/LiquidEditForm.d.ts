/// <reference types="react" />
import * as Yup from 'yup';
import { LiquidGroup } from '../../labware-ingred/types';
type Props = LiquidGroup & {
    canDelete: boolean;
    deleteLiquidGroup: () => unknown;
    cancelForm: () => unknown;
    saveForm: (liquidGroup: LiquidGroup) => unknown;
};
export declare const liquidEditFormSchema: Yup.Schema<{
    name: string;
    description: string;
    serialize: boolean;
} | undefined, any>;
export declare function LiquidEditForm(props: Props): JSX.Element;
export {};
