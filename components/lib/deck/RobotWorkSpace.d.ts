/// <reference types="react" />
import type { DeckDefinition } from '@opentrons/shared-data';
import type { RobotWorkSpaceRenderProps } from './types';
export interface RobotWorkSpaceProps {
    deckDef?: DeckDefinition;
    viewBox?: string;
    className?: string;
    children?: (props: RobotWorkSpaceRenderProps) => JSX.Element;
    deckLayerBlocklist?: string[];
}
export declare function RobotWorkSpace(props: RobotWorkSpaceProps): JSX.Element | null;
