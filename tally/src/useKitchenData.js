import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { guestApi, GUEST_STORAGE_KEY } from './guestKitchen.js'

const emptyKitchen = { recipes: [], lists: [] }
const newestFirst = (records) => [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export function useKitchenData(userId, isSignedIn, isLoaded) {
  const owner = isLoaded ? (isSignedIn ? userId : 'guest') : `pending:${userId || ''}`
  const [snapshot, setSnapshot] = useState({ owner: null, data: emptyKitchen })
  const [loadState, setLoadState] = useState({ owner: null, loading: Boolean(isSignedIn), error: '' })
  const ownerRef = useRef(owner)
  const requestRef = useRef(0)
  const freshnessRef = useRef({ owner: null, at: 0 })

  if (ownerRef.current !== owner) {
    ownerRef.current = owner
    requestRef.current += 1
  }

  const request = useCallback(async (path, options) => {
    if (!isLoaded || ownerRef.current !== owner) throw new Error('Your kitchen changed. Please try again.')
    const result = await (isSignedIn ? api : guestApi)(path, options)
    if (ownerRef.current !== owner) throw new Error('Your kitchen changed. Please try again.')
    return result
  }, [isLoaded, isSignedIn, owner])

  const reload = useCallback(async ({ force = true } = {}) => {
    const requestOwner = owner
    if (!isLoaded) return
    if (isSignedIn && !userId) return
    if (ownerRef.current !== requestOwner) return
    if (!force && freshnessRef.current.owner === requestOwner && Date.now() - freshnessRef.current.at < 60_000) return

    const requestId = ++requestRef.current
    const hasCurrentData = snapshot.owner === requestOwner
    setLoadState({ owner: requestOwner, loading: !hasCurrentData, error: '' })
    try {
      const result = await request('/bootstrap')
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
  }, [isLoaded, isSignedIn, owner, request, snapshot.owner, userId])

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && !userId) return
    void reload({ force: false })
  }, [isLoaded, isSignedIn, reload, userId])

  useEffect(() => {
    const onFocus = () => { void reload({ force: false }) }
    const onStorage = (event) => {
      if (owner === 'guest' && (event.key === GUEST_STORAGE_KEY || event.key === null)) void reload()
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onStorage)
    }
  }, [owner, reload])

  const ownsCurrentAccount = useCallback((capturedOwner) => (
    ownerRef.current === capturedOwner && capturedOwner === owner && isLoaded
  ), [isLoaded, owner])

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
    owner,
    recipes: hasData ? snapshot.data.recipes : [],
    lists: hasData ? snapshot.data.lists : [],
    loading: !isLoaded || loadState.owner !== owner || load.loading,
    request,
    isGuest: isLoaded && !isSignedIn,
    error: load.error,
    reload,
    setError,
    replaceList,
    replaceRecipe,
    removeRecipe,
    removeList,
  }
}
