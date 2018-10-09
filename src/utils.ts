export function merge(...args: Record<string, any>[]): Record<string, any> {
  const target: Record<string, any> = {}
  args.forEach(obj => {
    Object.keys(obj).forEach(key => {
      target[key] = obj[key]
    })
  })
  return target
}

export function pick(
  obj: Record<string, any>,
  keys: string[]
): Record<string, any> {
  const res: Record<string, any> = {}
  keys.forEach(key => {
    if (obj[key] !== void 0) {
      res[key] = obj[key]
    }
  })
  return res
}

export function omit(
  obj: Record<string, any>,
  keys: string[]
): Record<string, any> {
  const res: Record<string, any> = {}
  Object.keys(obj).forEach(key => {
    if (!includes(keys, key)) {
      res[key] = obj[key]
    }
  })
  return res
}

export function flattenObject(obj: Record<string, any>): any[] {
  return Object.keys(obj).reduce((acc, key) => {
    return acc.concat(obj[key])
  }, [])
}

export function mapValues<T, R>(
  obj: Record<string, T>,
  f: (val: T, key: string) => R
): Record<string, R> {
  const res: Record<string, R> = {}
  Object.keys(obj).forEach(key => {
    res[key] = f(obj[key], key)
  })
  return res
}

export function keys(...args: Record<string, any>[]): string[] {
  return Object.keys(merge(...args))
}

function includes(array: any[], item: any): boolean {
  return array.indexOf(item) > -1
}
