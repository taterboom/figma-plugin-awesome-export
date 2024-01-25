import { ENDPOINT } from "./constants"
import { genTinypngInitialState } from "./plugins/Tinypng"
import { Asset, Exportable, ImageType } from "./types"

figma.showUI(__html__, { width: 400, height: 600 })

let store = {
  ...genTinypngInitialState(),
  type: "PNG" as ImageType,
  scale: 3,
  useAbsoluteBounds: true,
  endpoint: ENDPOINT,
}

async function initStoreFromClientStorage() {
  const data = await Promise.all(
    Object.keys(store).map((key) =>
      // @ts-ignore
      figma.clientStorage.getAsync(key).then((value) => [key, value || store[key]])
    )
  )
  return Object.fromEntries(data)
}

initStoreFromClientStorage().then((data) => {
  console.log("init", data)
  store = data
})

function getExportables(): Exportable[] {
  const nodes = figma.currentPage.selection
  const exportables: Exportable[] = []

  for (const node of nodes) {
    if (node.type === "COMPONENT_SET") {
      continue
      // const children = node.children as ComponentNode[]

      // // Normalize each variant property type.
      // const variantPropertyTypes: Record<string, "text" | "boolean"> = {}
      // Object.entries(node.componentPropertyDefinitions).forEach(([k, v]) => {
      //   const options = new Set(v.variantOptions)
      //   const isBool = options.size === 2 && options.has("true") && options.has("false")
      //   variantPropertyTypes[k] = isBool ? "boolean" : "text"
      // })
      // console.log("Variant property types:", variantPropertyTypes)

      // for (const child of children) {
      //   const variantProperties = child.variantProperties
      //   if (!variantProperties) {
      //     continue
      //   }
      //   let variants: VariantInstance[] = Object.entries(variantProperties).map(([k, v]) => {
      //     return {
      //       type: variantPropertyTypes[k],
      //       property: k,
      //       value: v,
      //     }
      //   })
      //   console.log("Variant instances:", variants)

      //   exportables.push({
      //     id: child.id,
      //     parentName: node.name,
      //     variants,
      //     size: {
      //       width: child.width,
      //       height: child.height,
      //     },
      //   })
      // }
      // } else if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "GROUP") {
    } else {
      exportables.push({
        id: node.id,
        parentName: node.name,
        variants: [],
        size: {
          width: node.width,
          height: node.height,
        },
      })
    }
  }

  return exportables
}

async function getExportPayload(exportables: Exportable[]) {
  const assets: Asset[] = []
  for (const e of exportables) {
    let node = figma.getNodeById(e.id) as FrameNode
    if (!node) {
      continue
    }
    const exportSettings: ExportSettingsImage = {
      suffix: "",
      format: store.type,
      useAbsoluteBounds: store.useAbsoluteBounds,
      constraint: {
        type: "SCALE",
        value: store.scale,
      },
    }
    const exportData = await node.exportAsync(exportSettings)
    assets.push({
      buffer: exportData,
      node: {
        id: node.id,
        absoluteRenderBounds: node.absoluteRenderBounds,
        absoluteBoundingBox: node.absoluteBoundingBox,
      },
      rawNode: node,
      exportable: e,
    })
  }
  return assets
}

async function preview() {
  const data = await getExportPayload(getExportables())
  figma.ui.postMessage({ type: "PREVIEW", payload: data })
}

preview()
figma.on("selectionchange", preview)

figma.ui.on("message", (message) => {
  console.log("[code]", message)
  if (!message) return
  if (message.type === "STORE") {
    figma.ui.postMessage({
      type: "STORE_RES",
      payload: store,
    })
  }
  if (message.type === "CHECK_PREVIEW") {
    preview()
  }
  if (message.type === "STORE_UPDATE") {
    Object.entries(message.payload).forEach(([key, value]) => {
      // @ts-ignore
      store[key] = value
      figma.clientStorage.setAsync(key, value)
    })
    preview()
  }
})
