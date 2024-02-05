import { Options } from '@opentrons/components';
import { Selector } from '../../types';
import { LabwareNamesByModuleId } from '../../steplist/types';
export declare const getLabwareNamesByModuleId: Selector<LabwareNamesByModuleId>;
/** Returns dropdown option for labware placed on magnetic module */
export declare const getMagneticLabwareOptions: Selector<Options>;
/** Returns dropdown option for labware placed on temperature module */
export declare const getTemperatureLabwareOptions: Selector<Options>;
/** Returns dropdown option for labware placed on heater shaker module */
export declare const getHeaterShakerLabwareOptions: Selector<Options>;
/** Get single magnetic module (assumes no multiples) */
export declare const getSingleMagneticModuleId: Selector<string | null>;
/** Get single temperature module (assumes no multiples) */
export declare const getSingleTemperatureModuleId: Selector<string | null>;
/** Get single temperature module (assumes no multiples) */
export declare const getSingleThermocyclerModuleId: Selector<string | null>;
/** Returns boolean if magnetic module has labware */
export declare const getMagnetModuleHasLabware: Selector<boolean>;
/** Returns boolean if temperature module has labware */
export declare const getTemperatureModuleHasLabware: Selector<boolean>;
/** Returns boolean if thermocycler module has labware */
export declare const getThermocyclerModuleHasLabware: Selector<boolean>;
export declare const getMagnetLabwareEngageHeight: Selector<number | null>;
/** Returns boolean if Temperature Module is present on deck  */
export declare const getTempModuleIsOnDeck: Selector<boolean>;
export declare const getHeaterShakerModuleIsOnDeck: Selector<boolean>;
