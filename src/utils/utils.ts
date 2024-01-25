export function pick(obj: any, keys: string[]) {
  return keys.reduce((ret, key) => {
    ret[key] = obj[key]
    return ret
  }, {} as any)
}
