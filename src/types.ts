export interface Size {
  width: number
  height: number
}

export interface VariantInstance {
  type: "text" | "boolean"
  property: string
  value: string
}

export interface Exportable {
  id: string
  parentName: string
  variants: VariantInstance[]
  size: Size
}

export interface Asset {
  rawNode: FrameNode // The raw node from the Figma API.
  node: Partial<FrameNode> // The node with only the properties we need.
  buffer: Uint8Array
  exportable: Exportable
}

export type ImageType = "PNG" | "JPG"
