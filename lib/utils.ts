export const isAsyncFunction = (fn: any): boolean => {
  return fn && {}.toString.call(fn) === '[object AsyncFunction]'
}