export interface Health {
    name: string;
    api_version: string;
    fw_version: string;
    board_revision: string;
    logs: string[];
    system_version: string;
    maximum_protocol_api_version: [major: number, minor: number];
    minimum_protocol_api_version: [major: number, minor: number];
    links: HealthLinks;
}
export interface HealthLinks {
    apiLog: string;
    serialLog: string;
    serverLog: string;
    apiSpec: string;
    systemTime: string;
}
