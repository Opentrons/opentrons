import { CommandCreatorWarning } from '@opentrons/step-generation';
import { Selector } from '../../types';
export declare const getTimelineWarningsForSelectedStep: Selector<CommandCreatorWarning[]>;
type HasWarningsPerStep = Record<string, boolean>;
export declare const getHasTimelineWarningsPerStep: Selector<HasWarningsPerStep>;
export {};
