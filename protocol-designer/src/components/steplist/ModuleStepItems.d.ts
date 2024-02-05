import * as React from 'react';
import { UseHoverTooltipTargetProps } from '@opentrons/components';
import { ModuleType } from '@opentrons/shared-data';
export interface ModuleStepItemRowProps {
    label?: string | null;
    value?: string | null;
    targetProps?: UseHoverTooltipTargetProps;
}
export declare const ModuleStepItemRow: (props: ModuleStepItemRowProps) => JSX.Element;
interface Props {
    action?: string;
    moduleType: ModuleType;
    actionText: string;
    labwareNickname?: string | null;
    message?: string | null;
    children?: React.ReactNode;
    hideHeader?: boolean;
}
export declare const ModuleStepItems: (props: Props) => JSX.Element;
export {};
