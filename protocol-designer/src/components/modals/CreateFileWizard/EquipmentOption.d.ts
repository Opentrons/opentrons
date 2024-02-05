import * as React from 'react';
import { StyleProps } from '@opentrons/components';
interface EquipmentOptionProps extends StyleProps {
    onClick: React.MouseEventHandler;
    isSelected: boolean;
    text: React.ReactNode;
    image?: React.ReactNode;
    showCheckbox?: boolean;
    disabled?: boolean;
}
export declare function EquipmentOption(props: EquipmentOptionProps): JSX.Element;
export {};
