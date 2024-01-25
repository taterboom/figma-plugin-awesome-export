import clsx from "classnames"
import copy from "copy-to-clipboard"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { PopupContainer } from "./components/Popup"
import { MaterialSymbolsHelpOutline, MaterialSymbolsMoreVert } from "./components/icons"
import { useFirstMount } from "./components/useFirstMount"
import { Asset, ImageType } from "./types"
import { getConfig } from "./utils/upload"
import { pick } from "./utils/utils"
import { TinypngDownloadProcess, TinypngSettings, useTinypng } from "./plugins/Tinypng"
import Switch from "./components/Switch"

const container = document.getElementById("app")
const root = createRoot(container!)
root.render(<Root />)

function sendFigmaQuery(type: string, payload?: any) {
  window.parent.postMessage(
    {
      pluginMessage: {
        type,
        payload,
      },
    },
    "*"
  )
}

function Root() {
  const [store, setStore] = useState(null)
  useEffect(() => {
    sendFigmaQuery("STORE")
    window.addEventListener("message", (e) => {
      const pluginMessage = e.data.pluginMessage
      if (!pluginMessage) return
      if (pluginMessage.type === "STORE_RES") {
        setStore(pluginMessage.payload)
        useTinypng.setState(pick(pluginMessage.payload, Object.keys(useTinypng.getState())))
      }
    })
  }, [])
  if (!store) return null
  return <App initialValue={store} />
}

function formatNumber(n: number) {
  if (n % 1 !== 0) return n?.toFixed?.(1)
  return n.toString()
}

function App({ initialValue }: { initialValue: any }) {
  const isFirstMount = useFirstMount()
  const [type, setType] = useState<"PNG" | "JPG">(initialValue.type)
  const [scale, setScale] = useState(initialValue.scale)
  const [useAbsoluteBounds, setUseAbsoluteBounds] = useState(initialValue.useAbsoluteBounds)
  const [endpoint, setEndpoint] = useState(initialValue.endpoint)
  const [assets, setAssets] = useState<Asset[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<any | null>(null)
  const [moreVisible, setMoreVisible] = useState(false)
  const [useAbsoluteBoundsModalVisible, setUseAbsoluteBoundsModalVisible] = useState(false)
  const [endpointModalVisible, setEndpointModalVisible] = useState(false)
  const endpointRef = useRef(endpoint)
  endpointRef.current = endpoint
  useEffect(() => {
    sendFigmaQuery("CHECK_PREVIEW")
    window.addEventListener("message", (e) => {
      const pluginMessage = e.data.pluginMessage
      if (!pluginMessage) return
      if (pluginMessage.type === "PREVIEW") {
        const assets: Asset[] = pluginMessage.payload
        setAssets(assets)
      }
      if (pluginMessage.type === "GENERATE_CONFIG") {
        const { file, token } = pluginMessage.payload
        getConfig(endpointRef.current, token, file).then((res) => {
          sendFigmaQuery("GENERATE_CONFIG_RES", res)
        })
      }
    })
  }, [])
  const file = useMemo(
    () =>
      assets[0]
        ? new File([assets[0].buffer], `${assets[0].exportable.parentName}.${type.toLowerCase()}`, {
            type: `image/${type.toLowerCase()}`,
          })
        : undefined,
    [assets]
  )
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [assets])
  const absoluteBoundingBoxDimension = useMemo(() => {
    return assets[0]
      ? [assets[0].node.absoluteBoundingBox?.width, assets[0].node.absoluteBoundingBox?.height]
      : null
  }, [assets])
  const absoluteRenderBoundsDimension = useMemo(() => {
    return assets[0]
      ? [assets[0].node.absoluteRenderBounds?.width, assets[0].node.absoluteRenderBounds?.height]
      : null
  }, [assets])
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])
  useEffect(() => {
    if (isFirstMount) return
    sendFigmaQuery("STORE_UPDATE", {
      type,
      scale,
      useAbsoluteBounds,
      endpoint,
    })
  }, [type, scale, useAbsoluteBounds, endpoint])
  useEffect(() => {
    useTinypng.subscribe((state) => {
      sendFigmaQuery("STORE_UPDATE", {
        ...state,
      })
    })
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* img */}
      <div className="flex-1 flex justify-center items-center p-2 overflow-hidden">
        {url ? (
          <div className="max-h-full overflow-y-auto">
            <img src={url} className="mx-auto border border-solid border-indicator" />
            {useAbsoluteBounds && absoluteBoundingBoxDimension && (
              <div className="text-sm text-indicator text-center mt-1">
                {formatNumber(absoluteBoundingBoxDimension[0]!)} x{" "}
                {formatNumber(absoluteBoundingBoxDimension[1]!)}
              </div>
            )}
            {!useAbsoluteBounds && absoluteRenderBoundsDimension && (
              <div className="text-sm text-indicator text-center mt-1">
                {formatNumber(absoluteRenderBoundsDimension[0]!)} x{" "}
                {formatNumber(absoluteRenderBoundsDimension[1]!)}
              </div>
            )}
          </div>
        ) : (
          "Select elements in the canvas"
        )}
      </div>
      {/* controller */}
      <div className="relative z-20 shrink-0">
        <AnimatePresence>
          {moreVisible && (
            <motion.div
              className="absolute left-0 top-0 w-full p-2 bg-base-100 -z-10 space-y-2 border-b border-neutral-100 common-shadow"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: "-100%", opacity: 1 }}
              exit={{ y: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="block space-y-1">
                <span className="text-content-100 text-sm font-medium inline-flex items-center space-x-1">
                  <span>Absolute Bounds Mode</span>
                  <MaterialSymbolsHelpOutline
                    className="cursor-pointer"
                    onClick={() => {
                      setUseAbsoluteBoundsModalVisible(true)
                    }}
                  ></MaterialSymbolsHelpOutline>
                </span>
                <Switch checked={useAbsoluteBounds} onChange={setUseAbsoluteBounds}></Switch>
              </div>
              <label className="block space-y-1">
                <span className="text-content-100 text-sm font-medium inline-flex items-center space-x-1">
                  <span>Endpoint</span>
                  <MaterialSymbolsHelpOutline
                    className="cursor-pointer"
                    onClick={() => {
                      setEndpointModalVisible(true)
                    }}
                  ></MaterialSymbolsHelpOutline>
                </span>
                <input
                  type="text"
                  className="input"
                  value={endpoint}
                  onChange={(e) => {
                    setEndpoint(e.target.value)
                  }}
                />
              </label>
              <TinypngSettings></TinypngSettings>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={clsx(
            "flex justify-between items-center bg-base-100 py-2 px-2",
            !moreVisible && "common-shadow"
          )}
        >
          <div className="flex items-center gap-2">
            <div>
              <button
                className="btn btn-icon btn-ghost"
                onClick={() => {
                  setMoreVisible(!moreVisible)
                }}
              >
                <MaterialSymbolsMoreVert />
              </button>
            </div>
            <select
              className="select min-w-[4rem]"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ImageType)
              }}
            >
              <option value="PNG">PNG</option>
              <option value="JPG">JPG</option>
            </select>
            <select
              className="select min-w-[2rem]"
              value={scale}
              onChange={(e) => {
                setScale(+e.target.value)
              }}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <TinypngDownloadProcess
              endpoint={endpoint}
              file={file}
              onResult={setResult}
              onError={setError}
            ></TinypngDownloadProcess>
          </div>
        </div>
      </div>
      {/* Result */}
      <AnimatePresence>
        {result && (
          <PopupContainer onClick={() => setResult(null)}>
            <div className="text-base font-medium">Result</div>
            <div className="break-all outline select-all py-px px-1" onClick={() => copy(result)}>
              {result}
            </div>
          </PopupContainer>
        )}
      </AnimatePresence>
      {/* Error */}
      <AnimatePresence>
        {error && (
          <PopupContainer onClick={() => setError(null)}>
            <div className="text-base font-medium text-danger-100">Error</div>
            <div className="break-all outline select-all py-px px-1">
              {error?.message || JSON.stringify(error)}
            </div>
          </PopupContainer>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {useAbsoluteBoundsModalVisible && (
          <PopupContainer
            onClick={() => {
              setUseAbsoluteBoundsModalVisible(false)
            }}
          >
            <div className="outline py-px px-1">
              <p>
                Absolute Bounds Mode is different from Figma's default export method. It exports the
                frame containing the elements rather than the rendering box.
              </p>
              <p>
                You can read more in the{" "}
                <a
                  className="text-primary-100"
                  href="https://github.com/taterboom/figma-plugin-awesome-export?tab=readme-ov-file#absolute-bounds-mode"
                  target="_blank"
                >
                  plugin documentation
                </a>
                .
              </p>
            </div>
          </PopupContainer>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {endpointModalVisible && (
          <PopupContainer
            onClick={() => {
              setEndpointModalVisible(false)
            }}
          >
            <div className="outline py-px px-1">
              <p>
                As Tinypng doesn't support cross-origin requests, the plugin forwards Tinypng API
                requests through a{" "}
                <a
                  className="text-primary-100"
                  href="https://github.com/taterboom/cors-gateway"
                  target="_blank"
                >
                  cors-gateway
                </a>
                . You can also set up your own endpoint.
              </p>
              <p>
                You can read more in the{" "}
                <a
                  className="text-primary-100"
                  href="https://github.com/taterboom/figma-plugin-awesome-export?tab=readme-ov-file#tinypng"
                  target="_blank"
                >
                  plugin documentation
                </a>
                .
              </p>
            </div>
          </PopupContainer>
        )}
      </AnimatePresence>
    </div>
  )
}
