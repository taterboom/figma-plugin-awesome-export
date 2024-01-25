import { useState } from "react"
import { create } from "zustand"
import { tinypng } from "../utils/tinypng"
import { LineMdLoadingLoop } from "../components/icons"
import { downloadFile } from "../utils/downloadFile"

export const genTinypngInitialState = () => ({
  tinypngApiKey: "",
})

export const useTinypng = create<{ tinypngApiKey: string }>()(genTinypngInitialState)

export const TinypngSettings = () => {
  const { tinypngApiKey } = useTinypng()
  return (
    <>
      <label className="block space-y-1">
        <span className="text-content-100 text-sm font-medium">Tinypng API Key</span>
        <input
          type="text"
          className="input"
          value={tinypngApiKey}
          onChange={(e) => {
            useTinypng.setState({ tinypngApiKey: e.target.value })
          }}
        />
      </label>
    </>
  )
}

export const TinypngDownloadProcess = (props: {
  file?: File
  endpoint: string
  onResult?: (data: any) => any
  onError?: (err: any) => any
}) => {
  const { file } = props
  const [loading, setLoading] = useState(false)
  const start = async () => {
    if (!file) return
    if (!useTinypng.getState().tinypngApiKey) {
      alert(
        "Please input tinypng api key \n(you can get it from https://tinypng.com/developers/subscription)"
      )
      return
    }
    setLoading(true)
    try {
      const raw = await file.arrayBuffer()
      const buf = await tinypng({
        endpoint: props.endpoint,
        apiKey: useTinypng.getState().tinypngApiKey,
        file: {
          buffer: raw,
        },
      })
      downloadFile(buf, file.name, file.type)
    } catch (err) {
      props.onError?.(err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      className={"btn btn-primary btn-xs" + (loading ? "loading" : "")}
      onClick={() => start()}
    >
      {loading && <LineMdLoadingLoop className="mr-1" />} Export
    </button>
  )
}
