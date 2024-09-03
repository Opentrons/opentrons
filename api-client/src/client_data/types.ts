export type DefaultClientData = Record<string, unknown>

export interface ClientDataResponse<T = DefaultClientData> {
  data: T
}

export interface ClientDataRequest<T = DefaultClientData> {
  data: T
}
