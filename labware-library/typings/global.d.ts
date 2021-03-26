export {}

declare global {
  module NodeJS {
    export interface Global {
      _fs_namespace: string | undefined
    }
  }
} 
