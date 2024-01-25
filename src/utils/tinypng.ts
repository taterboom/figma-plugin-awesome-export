export type TinypngOptions = { endpoint: string; apiKey: string; file: { buffer: ArrayBuffer } }

export async function tinypng(options: TinypngOptions) {
  const body = new Uint8Array(options.file.buffer)
  const data = await fetch(`${options.endpoint}/api/tinypng`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${window.btoa(`api:${options.apiKey}`)}`,
    },
    body,
  }).then((res) => res.arrayBuffer())
  return data
}
