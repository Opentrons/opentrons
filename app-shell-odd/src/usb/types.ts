export interface AppShellUsbDevice {
  id: string
  product: string
  manufacturer?: string | null
  vendorId?: string | null
  productId?: string | null
  serialNumber?: string | null
  location: string
  sysName: string
}
