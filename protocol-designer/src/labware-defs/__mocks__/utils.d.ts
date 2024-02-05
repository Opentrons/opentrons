/// <reference types="jest" />
import { LabwareDefinition1 } from '@opentrons/shared-data';
import { LabwareDefByDefURI } from '../types';
export declare const getAllDefinitions: jest.Mock<LabwareDefByDefURI, []>;
export declare const _getSharedLabware: jest.Mock<null, []>;
export declare const getOnlyLatestDefs: jest.Mock<LabwareDefByDefURI, []>;
export declare const getLegacyLabwareDef: jest.Mock<LabwareDefinition1, []>;
