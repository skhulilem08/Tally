import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api.js'

const emptyKitchen = { recipes: [], lists: [] }
const newestFirst = (records) => [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export function useKitchenData(userId, isSignedIn, isLoaded) {
  const owner = isLoaded ? (isSignedIn ? userId : null) : `pending:${userId || ''}`
  const [snapshot, setSnapshot] = useState({ owner: null, data: emptyKitchen })
  const [loadState, setLoadState] = useState({ owner: null, loading: Boolean(isSignedIn), error: '' })
  const ownerRef = useRef(owner)
  const requestRef = useRef(0)
  const freshnessRef = useRef({ owner: null, at: 0 })

  if (ownerRef.current !== owner) {
    ownerRef.current = owner
    requestRef.current += 1
  }

  const reload = useCallback(async ({ force = true } = {}) => {
    const requestOwner = owner
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      setSnapshot({ owner: null, data: emptyKitchen })
      setLoadState({ owner: null, loading: false, error: '' })
      return
    }
    if (ownerRef.current !== requestOwner) return
    if (!force && freshnessRef.current.owner === requestOwner && Date.now() - freshnessRef.current.at < 60_000) return

    const requestId = ++requestRef.current
    const hasCurrentData = snapshot.owner === requestOwner
    setLoadState({ owner: requestOwner, loading: !hasCurrentData, error: '' })
    try {
      const result = await api('/bootstrap')
      if (ownerRef.current !== requestOwner || requestRef.current !== requestId) return
      setSnapshot({
        owner: requestOwner,
        data: {
          recipes: newestFirst(result?.recipes || []),
          lists: newestFirst(result?.lists || []),
        },
      })
      freshnessRef.current = { owner: requestOwner, at: Date.now() }
      setLoadState({ owner: requestOwner, loading: false, error: '' })
    } catch (error) {
      if (ownerRef.current === requestOwner && requestRef.current === requestId) {
        setLoadState({ owner: requestOwner, loading: false, error: error.message || 'Could not load your kitchen.' })
      }
    }
  }, [isLoaded, isSignedIn, owner, snapshot.owner, userId])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      setSnapshot({ owner: null, data: emptyKitchen })
      setLoadState({ owner: null, loading: false, error: '' })
      return
    }
    void reload({ force: false })
  }, [isLoaded, isSignedIn, reload, userId])

  useEffect(() => {
    const onFocus = () => { void reload({ force: false }) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload])

  const ownsCurrentAccount = useCallback((capturedOwner) => (
    ownerRef.current === capturedOwner && capturedOwner === owner && isLoaded && isSignedIn
  ), [isLoaded, isSignedIn, owner])

  const replaceList = useCallback((list) => {
    if (!ownsCurrentAccount(owner)) return
    requestRef.current += 1
    setSnapshot((current) => {
      const data = current.owner === owner ? current.data : emptyKitchen
      return { owner, data: { ...data, lists: newestFirst([list, ...data.lists.filter((item) => item.id !== list.id)]) } }
    })
    setLoadState({ owner, loading: false, error: '' })
  }, [owner, ownsCurrentAccount])

  const replaceRecipe = useCallback((recipe) => {
    if (!ownsCurrentAccount(owner)) return
    requestRef.current += 1
    setSnapshot((current) => {
      const data = current.owner === owner ? current.data : emptyKitchen
      return { owner, data: { ...data, recipes: newestFirst([recipe, ...data.recipes.filter((item) => item.id !== recipe.id)]) } }
    })
    setLoadState({ owner, loading: false, error: '' })
  }, [owner, ownsCurrentAccount])

  const removeRecipe = useCallback((id) => {
    if (!ownsCurrentAccount(owner)) return
    requestRef.current += 1
    setSnapshot((current) => current.owner === owner
      ? { owner, data: { ...current.data, recipes: current.data.recipes.filter((item) => item.id !== id) } }
      : current)
  }, [owner, ownsCurrentAccount])

  const removeList = useCallback((id) => {
    if (!ownsCurrentAccount(owner)) return
    requestRef.current += 1
    setSnapshot((current) => current.owner === owner
      ? { owner, data: { ...current.data, lists: current.data.lists.filter((item) => item.id !== id) } }
      : current)
  }, [owner, ownsCurrentAccount])

  const setError = useCallback((message) => {
    if (ownsCurrentAccount(owner)) setLoadState({ owner, loading: false, error: message || '' })
  }, [owner, ownsCurrentAccount])

  const hasData = snapshot.owner === owner
  const load = loadState.owner === owner ? loadState : { loading: Boolean(isSignedIn), error: '' }
  return {
    recipes: hasData ? snapshot.data.recipes : [],
    lists: hasData ? snapshot.data.lists : [],
    loading: !isLoaded ? false : Boolean(isSignedIn) && (loadState.owner !== owner || load.loading),
    error: load.error,
    reload,
    setError,
    replaceList,
    replaceRecipe,
    removeRecipe,
    removeList,
  }
}
