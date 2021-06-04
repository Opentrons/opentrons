export declare const falconTubeOptions: {
    namespace: string;
    metadata: {
        displayName: string;
        displayCategory: string;
        displayVolumeUnits: string;
        tags: never[];
    };
    parameters: {
        format: string;
        isTiprack: boolean;
        isMagneticModuleCompatible: boolean;
    };
    dimensions: {
        xDimension: number;
        yDimension: number;
        zDimension: number;
    };
    offset: {
        x: number;
        y: number;
        z: number;
    }[];
    grid: {
        row: number;
        column: number;
    }[];
    spacing: {
        row: number;
        column: number;
    }[];
    well: {
        totalLiquidVolume: number;
        diameter: number;
        shape: string;
        depth: number;
    }[];
    gridStart: {
        rowStart: string;
        colStart: string;
        rowStride: number;
        colStride: number;
    }[];
    group: {
        metadata: {
            displayName: string;
            displayCategory: string;
            wellBottomShape: string;
        };
        brand: {
            brand: string;
            brandId: string[];
            links: string[];
        };
    }[];
    brand: {
        brand: string;
        brandId: never[];
        links: string[];
    };
};
