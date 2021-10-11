import { AxiosRequestConfig } from 'axios';
import type { Method, AxiosPromise, AxiosResponse } from 'axios';
import type { HostConfig } from './types';
export declare type ResponsePromise<Data> = AxiosPromise<Data>;
export declare type Response<Data> = AxiosResponse<Data>;
export declare const DEFAULT_PORT = 31950;
export declare const DEFAULT_HEADERS: {
    'Opentrons-Version': string;
};
export declare const GET = "GET";
export declare const POST = "POST";
export declare const DELETE = "DELETE";
export declare function request<ResData, ReqData = null>(method: Method, url: string, data: ReqData, config: HostConfig, params?: AxiosRequestConfig['params']): ResponsePromise<ResData>;
