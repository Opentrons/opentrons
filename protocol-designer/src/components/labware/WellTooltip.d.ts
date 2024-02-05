import * as React from 'react';
import type { LocationLiquidState } from '@opentrons/step-generation';
import type { WellIngredientNames } from '../../steplist/types';
interface WellTooltipParams {
    makeHandleMouseEnterWell: (wellName: string, wellIngreds: LocationLiquidState) => (e: React.MouseEvent<any>) => void;
    handleMouseLeaveWell: (val: unknown) => void;
    tooltipWellName?: string | null;
}
interface WellTooltipProps {
    children: (wellTooltipParams: WellTooltipParams) => React.ReactNode;
    ingredNames: WellIngredientNames;
}
export declare const WellTooltip: (props: WellTooltipProps) => JSX.Element;
export {};
