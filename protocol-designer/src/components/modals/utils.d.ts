import { LabwareDefByDefURI } from '../../labware-defs';
export interface TiprackOption {
    name: string;
    value: string;
}
interface TiprackOptionsProps {
    allLabware: LabwareDefByDefURI;
    allowAllTipracks: boolean;
    selectedPipetteName?: string | null;
}
export declare function getTiprackOptions(props: TiprackOptionsProps): TiprackOption[];
export {};
