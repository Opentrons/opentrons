export interface AdapterAndLabware {
    labwareUri: string;
    adapterUri: string;
    labwareDisplayName: string;
    adapterDisplayName: string;
}
export declare const getAdapterAndLabwareSplitInfo: (labwareId: string) => AdapterAndLabware;
