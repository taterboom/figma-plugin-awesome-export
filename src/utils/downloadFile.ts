export function downloadFile(buf: ArrayBuffer, name: string, type: string) {
  const file = new File([buf], name, { type })
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.download = file.name
  a.href = url!
  a.click()
  URL.revokeObjectURL(url)
}
