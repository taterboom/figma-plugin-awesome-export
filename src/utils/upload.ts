async function cryptoSign(endpoint: string, k: any, m: any) {
  // const enc = new TextEncoder()
  // const key = await window.crypto.subtle.importKey(
  //   "raw",
  //   enc.encode(k),
  //   {
  //     name: "HMAC",
  //     hash: { name: "SHA-1" },
  //   },
  //   false,
  //   ["sign", "verify"]
  // )
  // const encodedText = enc.encode(m)
  // const signature = await window.crypto.subtle.sign("HMAC", key, encodedText)
  // const signatureText = btoa(String.fromCharCode(...new Uint8Array(signature)))
  // return signatureText

  // warning!!!
  // window.crypto.subtle is undefined in insecure environments
  // so we use the api
  console.log("cryptoSign", k, m)
  const { data: encoded } = await fetch(`${endpoint}/api/enc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: k,
      message: m,
    }),
  }).then((res) => res.json())
  console.log(encoded)
  return encoded
}

export type Options = {
  endpoint: string
  code: string
  cookie: string
  file: {
    type: string
    buffer: ArrayBuffer
  }
}

// safe in pure js
export async function getToken(options: Options) {
  const { file, code, cookie } = options
  let ext = file.type.split("/")[1]
  console.log(file.type, ext)
  if (ext === "svg+xml") {
    ext = "svg"
  }
  const result = await fetch(
    `${options.endpoint}/api/token?cookie=${encodeURIComponent(
      cookie
    )}&code=${code}&green_check=true&media_type=${ext}`,
    {
      headers: {
        cookie: cookie,
      },
    }
  ).then((res) => res.json())
  console.log("token", result)
  return result.data
}

type AliOSSOptions = { apiUrl: string; gmtStr: string; authorization: string; aliHeaders: any }

// safe in pure js
export async function upload(fileOptions: Options, aliOSSOptions: AliOSSOptions) {
  const { file } = fileOptions
  const { apiUrl, gmtStr, authorization, aliHeaders } = aliOSSOptions
  const body = new Uint8Array(file.buffer)
  return fetch(apiUrl, {
    method: "PUT",
    headers: Object.assign(
      {
        "Content-Type": file.type,
        Date: gmtStr,
        authorization: authorization,
      },
      aliHeaders
    ),
    body: body,
  }).then(async (res) => {
    if (!res.ok) {
      const t = await res.text()
      throw new Error(t)
    }
    return res.json()
  })
}

// not safe in pure js
export async function getConfig(endpoint: string, token: any, file: Options["file"]) {
  const callback = {
    callbackUrl: token.callback_url,
    callbackBody: token.callback_body,
    callbackBodyType: "application/json",
  }
  // @ts-ignore
  const gmtStr = new Date().toGMTString()
  const aliHeaders = {
    "x-oss-callback": btoa(JSON.stringify(callback)),
    "x-oss-callback-var": btoa(JSON.stringify(token.callback_vars)),
    "x-oss-date": gmtStr,
    "x-oss-security-token": token.Credentials.SecurityToken,
  }
  let signatureStr = "PUT\n"
  signatureStr += "\n"
  signatureStr += file.type + "\n"
  signatureStr += gmtStr + "\n"
  signatureStr +=
    Object.entries(aliHeaders)
      .map(([k, v]) => `${k}:${v}`)
      .join("\n") + "\n"
  signatureStr += "/" + token.bucket_name + "/" + token.key
  const signature = await cryptoSign(endpoint, token.Credentials.AccessKeySecret, signatureStr)
  const authorization = "OSS " + token.Credentials.AccessKeyId + ":" + signature
  const apiUrlObj = new URL(token.endpoint)
  apiUrlObj.host = token.bucket_name + "." + apiUrlObj.host
  apiUrlObj.pathname = token.key
  const apiUrl = apiUrlObj.toString()
  return { apiUrl, gmtStr, authorization, aliHeaders }
}

export async function run(options: Options) {
  const token = await getToken(options)
  const config: any = await getConfig(options.endpoint, token, options.file)
  const result = await upload(options, config)
  console.log("res", result)
  return result
}
