import { useCallback, useContext } from "react"
import { AppContext } from "../utils/context"
import { fakeFetch, RegisteredEndpoints } from "../utils/fetch"
import { useWrappedRequest } from "./useWrappedRequest"

export function useCustomFetch() {
  const { cache, dirtyPages } = useContext(AppContext)
  const { loading, wrappedRequest } = useWrappedRequest()

  const fetchWithCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const cacheKey = getCacheKey(endpoint, params)
        const cacheResponse = cache?.current.get(cacheKey)
        let flagDirty = false

        if (cacheResponse) {
          const data = JSON.parse(cacheResponse)

          //if (endpoint === "employees") {
          // Employee[]
          // need not check for dirty page
          //} else
          if (endpoint === "paginatedTransactions") {
            // PaginatedResponse Employee[]
            for (let page of data.data) {
              //let page = data[i]
              if (dirtyPages?.current.has(page.id)) {
                dirtyPages?.current.delete(data.id)
                // need to clear all dirty entries matching
                flagDirty = true
              }
            }
          } else if (endpoint === "transactionsByEmployee") {
            // Transaction[]
            for (let page of data) {
              if (dirtyPages?.current.has(page.id)) {
                dirtyPages?.current.delete(data.id)
                // need to clear all dirty entries matching
                flagDirty = true
              }
            }
          }

          if (!flagDirty) {
            return data as Promise<TData>
          } else {
            const result = await fakeFetch<TData>(endpoint, params)
            cache?.current.set(cacheKey, JSON.stringify(result))
            return result
          }
        }
        const result = await fakeFetch<TData>(endpoint, params)
        cache?.current.set(cacheKey, JSON.stringify(result))
        return result
      }),
    [cache, dirtyPages, wrappedRequest]
  )

  const fetchWithoutCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const result = await fakeFetch<TData>(endpoint, params)
        return result
      }),
    [wrappedRequest]
  )

  const markDirty = useCallback(
    async (transactionId: string) => {
      dirtyPages?.current.add(transactionId)
      console.log("Now dirty", transactionId)
    },
    [dirtyPages]
  )

  const clearCache = useCallback(() => {
    if (cache?.current === undefined) {
      return
    }

    cache.current = new Map<string, string>()
  }, [cache])

  const clearCacheByEndpoint = useCallback(
    (endpointsToClear: RegisteredEndpoints[]) => {
      if (cache?.current === undefined) {
        return
      }

      const cacheKeys = Array.from(cache.current.keys())

      for (const key of cacheKeys) {
        const clearKey = endpointsToClear.some((endpoint) => key.startsWith(endpoint))

        if (clearKey) {
          cache.current.delete(key)
        }
      }
    },
    [cache]
  )

  return { fetchWithCache, fetchWithoutCache, clearCache, clearCacheByEndpoint, loading, markDirty }
}

function getCacheKey(endpoint: RegisteredEndpoints, params?: object) {
  return `${endpoint}${params ? `@${JSON.stringify(params)}` : ""}`
}
