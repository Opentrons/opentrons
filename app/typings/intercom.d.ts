import 'intercom-binding'

declare global {
  namespace NodeJS {
    export interface Global {
      Intercom: (...args: any[]) => unknown
    }
  }
}
