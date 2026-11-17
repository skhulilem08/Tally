import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react'
import { publishableKeyFromHost } from '@clerk/react/internal'
import { shadcn } from '@clerk/themes'
import { Redirect, Route, Router as WouterRouter, Switch, Link, useLocation } from 'wouter'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleHelp, Clock3, CookingPot, House, ListChecks, LoaderCircle, LogOut,
  MoreHorizontal, Plus, Search, Send, Settings as SettingsIcon,
  ShoppingBasket, Sparkles, Sun, Trash2, UserRound, X,
} from './icons.jsx'
import { api } from './api.js'
import { useKitchenData } from './useKitchenData.js'
import { useRecipeRecommendations } from './useRecipeRecommendations.js'
import { recordRecipeOpen, RECIPE_ACTIVITY_EVENT } from './recipeActivity.js'
import './App.css'
import './assistant.css'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL
const routeScrollPositions = new Map()

const emptyRecipe = () => ({
  title: '', description: '', servings: 2, prepMinutes: null, cookMinutes: null,
  ingredients: [{ name: '', amount: '', unit: '' }], steps: [''], notes: '',
})
const idForRequest = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''
const assistantDraftPayload = (draft) => {
  if (!draft) return null
  const servings = Number(draft.servings)
  const ingredients = (draft.ingredients || []).map((item) => ({
    name: String(item.name || '').trim(),
    amount: Number(item.amount),
    unit: String(item.unit || '').trim(),
  }))
  const steps = (draft.steps || []).map((step) => String(step).trim()).filter(Boolean)
  if (!String(draft.title || '').trim() || !Number.isFinite(servings) || servings <= 0 ||
      !ingredients.length || ingredients.some((item) => !item.name || !Number.isFinite(item.amount) || item.amount <= 0 || !item.unit) || !steps.length) return null
  const prepMinutes = draft.prepMinutes == null || draft.prepMinutes === '' ? null : Number(draft.prepMinutes)
  const cookMinutes = draft.cookMinutes == null || draft.cookMinutes === '' ? null : Number(draft.cookMinutes)
  if ([prepMinutes, cookMinutes].some((value) => value !== null && (!Number.isFinite(value) || value < 0))) return null
  return {
    title: String(draft.title).trim(),
    description: String(draft.description || '').trim(),
    servings,
    prepMinutes,
    cookMinutes,
    ingredients,
    steps,
    notes: String(draft.notes || '').trim(),
  }
}

function StripBase(path) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path
}

function ClerkRouterBridge({ children }) {
  const [, setLocation] = useLocation()
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        theme: shadcn,
        options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
        variables: {
          colorPrimary: 'var(--accent)', colorForeground: 'var(--text)', colorMutedForeground: 'var(--muted)',
          colorDanger: 'var(--danger)', colorBackground: 'var(--surface)', colorInput: 'var(--inset)',
          colorInputForeground: 'var(--text)', colorNeutral: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          borderRadius: '14px',
        },
        elements: {
          rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
          cardBox: { width: 'min(440px, 100%)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '22px', overflow: 'hidden', boxShadow: 'var(--shadow)' },
          card: { background: 'transparent', border: 0, boxShadow: 'none', borderRadius: 0 },
          footer: { background: 'transparent', border: 0, boxShadow: 'none', borderRadius: 0 },
          headerTitle: { color: 'var(--text)', fontWeight: 650 },
          headerSubtitle: { color: 'var(--muted)' },
          socialButtonsBlockButtonText: { color: 'var(--text)', fontWeight: 550 },
          formFieldLabel: { color: 'var(--text)', fontWeight: 550 },
          footerActionLink: { color: 'var(--accent-ink)', fontWeight: 650 },
          footerActionText: { color: 'var(--muted)' },
          dividerText: { color: 'var(--muted)' },
          identityPreviewEditButton: { color: 'var(--accent-ink)' },
          formFieldSuccessText: { color: 'var(--success)' },
          alertText: { color: 'var(--danger)' },
          logoBox: { marginBottom: '12px' }, logoImage: { height: '36px', width: 'auto' },
          socialButtonsBlockButton: { border: '1px solid var(--line)', background: 'var(--surface-raised)', color: 'var(--text)', borderRadius: '12px' },
          formButtonPrimary: { background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: '12px', fontWeight: 650 },
          formFieldInput: { background: 'var(--inset)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '11px' },
          footerAction: { color: 'var(--muted)' },
          dividerLine: { background: 'var(--line)' },
          alert: { background: 'var(--pink-soft)', borderRadius: '12px' },
          otpCodeFieldInput: { background: 'var(--inset)', color: 'var(--text)', borderColor: 'var(--line)' },
          formFieldRow: { color: 'var(--text)' },
          main: { color: 'var(--text)' },
        },
      }}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Your kitchen, just where you left it.' } },
        signUp: { start: { title: 'Make Tally yours', subtitle: 'Keep the recipes you really cook.' } },
      }}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(StripBase(to))}
      routerReplace={(to) => setLocation(StripBase(to), { replace: true })}
    >
      {children}
    </ClerkProvider>
  )
}

function AuthPage({ mode }) {
  const { isSignedIn } = useUser()
  return (
    <main className="auth-page">
      <Link href="/" className="auth-back"><ArrowLeft size={18} /> Back to Tally</Link>
      <div className="auth-brand"><span className="brand-mark"><CookingPot size={19} /></span> Tally</div>
      {mode === 'in'
        ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}
      {!isSignedIn && <Link href="/home" className="button button-secondary">Continue as guest</Link>}
    </main>
  )
}

function App() {
  if (!clerkPubKey) return <main className="setup-error"><CookingPot /><h1>Tally is almost ready</h1><p>Authentication needs a Clerk publishable key before private kitchen data can be opened.</p></main>
  return <WouterRouter base={basePath}><ClerkRouterBridge><AppRoutes /></ClerkRouterBridge></WouterRouter>
}

function AppRoutes() {
  const { isSignedIn, isLoaded, user } = useUser()
  // A local guest kitchen must not wait for the cloud identity service.
  // Signed-in access still waits for Clerk to resolve the current account.
  const storageReady = isLoaded || !isSignedIn
  const kitchen = useKitchenData(user?.id, isSignedIn, storageReady)
  const [theme, setTheme] = useState(() => localStorage.getItem('tally-theme') || 'system')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('tally-theme', theme)
  }, [theme])
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {})
  }, [])
  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previous }
  }, [])
  const common = { kitchen, user, isSignedIn, canUseKitchen: storageReady, isLoaded, theme, setTheme }
  return (
    <Switch>
      <Route path="/sign-in/*?">{() => <AuthPage mode="in" />}</Route>
      <Route path="/sign-up/*?">{() => <AuthPage mode="up" />}</Route>
      <Route path="/">{() => isSignedIn ? <Redirect to="/home" /> : <AppShell {...common}><Home {...common} /></AppShell>}</Route>
      <Route path="/home">{() => <AppShell {...common}><Home {...common} /></AppShell>}</Route>
      <Route path="/cookbook">{() => <AppShell {...common}><Cookbook {...common} key={user?.id || 'signed-out'} /></AppShell>}</Route>
      <Route path="/cookbook/new">{() => <AppShell {...common}><RecipeEditor {...common} key={`${user?.id || 'signed-out'}:new`} /></AppShell>}</Route>
      <Route path="/cookbook/:id/edit">{(params) => <AppShell {...common}><RecipeEditor key={`${user?.id || 'signed-out'}:${params.id}`} {...common} recipe={kitchen.recipes.find((r) => r.id === params.id)} editId={params.id} /></AppShell>}</Route>
      <Route path="/cookbook/:id">{(params) => <AppShell {...common}><RecipeDetail {...common} recipe={kitchen.recipes.find((r) => r.id === params.id)} /></AppShell>}</Route>
      <Route path="/assistant">{() => <AppShell {...common}><Assistant {...common} key={user?.id || 'signed-out'} /></AppShell>}</Route>
      <Route path="/groceries">{() => <AppShell {...common}><Groceries {...common} /></AppShell>}</Route>
      <Route path="/groceries/plan">{() => <AppShell {...common}><GroceryPlanner {...common} key={user?.id || 'signed-out'} /></AppShell>}</Route>
      <Route path="/groceries/:id">{(params) => <AppShell {...common}><GroceryDetail {...common} list={kitchen.lists.find((l) => l.id === params.id)} /></AppShell>}</Route>
      <Route path="/settings">{() => <AppShell {...common}><SettingsPage {...common} /></AppShell>}</Route>
      <Route path="/settings/account">{() => <AppShell {...common}><AccountPage {...common} /></AppShell>}</Route>
      <Route>{() => <AppShell {...common}><NotFound /></AppShell>}</Route>
    </Switch>
  )
}

const tabs = [
  { href: '/home', label: 'Home', Icon: House },
  { href: '/cookbook', label: 'Cookbook', Icon: BookOpen },
  { href: '/assistant', label: 'AI Assistant', Icon: Sparkles },
  { href: '/groceries', label: 'Groceries', Icon: ShoppingBasket },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
]

function AppShell({ children }) {
  const [location, setLocation] = useLocation()
  const [online, setOnline] = useState(() => navigator.onLine)
  const previousLocation = useRef(location)
  const restoredLocation = useRef(false)
  const activePath = location === '/' ? '/home' : location
  const current = tabs.find((tab) => activePath.startsWith(tab.href)) || tabs[0]
  const isDetail = /\/(cookbook\/[^/]+|groceries\/[^/]+|settings\/account)$/.test(location) || location.endsWith('/new') || location.endsWith('/edit') || location.endsWith('/plan')
  const backPath = location.endsWith('/edit') ? location.replace(/\/edit$/, '') : location.endsWith('/new') ? '/cookbook' : location.endsWith('/plan') ? '/groceries' : location.startsWith('/cookbook/') ? '/cookbook' : location.startsWith('/groceries/') ? '/groceries' : '/settings'
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => {
    const saveScroll = () => routeScrollPositions.set(location, window.scrollY)
    window.addEventListener('scroll', saveScroll, { passive: true })
    return () => {
      routeScrollPositions.set(location, window.scrollY)
      window.removeEventListener('scroll', saveScroll)
    }
  }, [location])
  useLayoutEffect(() => {
    if (previousLocation.current !== location) {
      routeScrollPositions.set(previousLocation.current, window.scrollY)
      previousLocation.current = location
      window.scrollTo({ top: routeScrollPositions.get(location) || 0, behavior: 'auto' })
    } else if (!restoredLocation.current) {
      window.scrollTo({ top: routeScrollPositions.get(location) || 0, behavior: 'auto' })
    }
    restoredLocation.current = true
  }, [location])
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || !isDetail || document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      event.preventDefault()
      if (window.history.length > 1) window.history.back()
      else setLocation(backPath)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [backPath, isDetail, setLocation])
  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else setLocation(backPath)
  }
  const isHome = location === '/' || location === '/home'
  const isGroceries = location === '/groceries'
  return (
    <div className={`app-shell ${location === '/settings' ? 'settings-shell' : ''} ${isHome ? 'home-shell' : ''} ${location === '/cookbook' ? 'cookbook-shell' : ''} ${isGroceries ? 'groceries-shell' : ''} ${location === '/assistant' ? 'assistant-shell' : ''}`}>
      {!isHome && location !== '/cookbook' && !isGroceries && <header className="topbar">
        {isDetail ? <button className="back-button" type="button" onClick={goBack} aria-label="Go back" title="Go back"><ArrowLeft size={21} /></button> : <div className="brand-lockup"><span className="brand-mark"><CookingPot size={18} /></span><span>Tally</span></div>}
        <span className="topbar-context">{isDetail ? current.label : 'Your kitchen, kept close'}</span>
        <div className={`topbar-side ${online ? '' : 'offline-indicator'}`}>{online ? 'Personal cookbook' : 'Offline · may not sync'}</div>
      </header>}
      <main className={`screen-content ${isHome ? 'home-screen-content' : ''} ${location === '/cookbook' ? 'cookbook-screen-content' : ''} ${isGroceries ? 'groceries-screen-content' : ''} ${location === '/assistant' ? 'assistant-screen-content' : ''}`} key={current.href}>{children}</main>
      <nav className="tabbar" aria-label="Main navigation">
        {tabs.map(({ href, label, Icon }, index) => {
          const selected = location === href || (href === '/home' && location === '/') || (href !== '/home' && location.startsWith(href))
          return <Link key={href} href={href} className={`tab-item ${selected ? 'selected' : ''} ${index === 2 ? 'tab-assistant' : ''}`} aria-current={selected ? 'page' : undefined} data-testid={`tab-${label.toLowerCase().replace(' ', '-')}`}>
            <span className="tab-icon"><Icon size={index === 2 ? 22 : 20} strokeWidth={selected || index === 2 ? 1.8 : 1.5} /></span><span className="tab-label">{label}</span>
          </Link>
        })}
      </nav>
    </div>
  )
}

function ScreenTitle({ eyebrow, title, detail, action }) {
  return <div className="screen-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{detail && <p className="screen-lede">{detail}</p>}</div>{action && <div className="title-action">{action}</div>}</div>
}
function ErrorNotice({ children, onRetry }) {
  if (!children) return null
  return <div className="error-notice" role="alert"><span>{children}</span>{onRetry && <button type="button" className="text-button" onClick={onRetry}>Try again</button>}</div>
}
function LoadingRows() { return <div className="loading-block" aria-label="Loading your kitchen"><span /><span /><span /></div> }
function SignInPrompt({ title = 'Your kitchen is yours', children = 'Sign in to open your saved recipes, lists and notes.', action = 'Sign in' }) {
  return <section className="signed-out-card"><span className="prompt-icon"><UserRound size={22} /></span><h2>{title}</h2><p>{children}</p><div className="button-row"><Link className="button button-primary" href="/sign-in">{action}<ArrowRight size={17} /></Link><Link href="/sign-up" className="button button-secondary">Create account</Link></div></section>
}

function Home({ kitchen, canUseKitchen, user }) {
  const recentRecipes = kitchen.recipes.slice(0, 3)
  const latestList = kitchen.lists[0]
  const { recommendations } = useRecipeRecommendations(kitchen.recipes, user?.id || 'guest')
  const firstName = user?.firstName
  const [hour] = useState(() => new Date().getHours())
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <div className="page home-page">
      <header className="home-greeting">
        <h1>{greeting}{firstName ? `, ${firstName}` : ''}</h1>
        <div className="home-toolbar" aria-label="Kitchen collections">
          <Link href="/cookbook" className="home-toolbar-button" aria-label="Open cookbook" title="Cookbook" data-testid="home-open-cookbook"><BookOpen size={19} /></Link>
          <Link href="/groceries" className="home-toolbar-button" aria-label="Open grocery lists" title="Groceries" data-testid="home-open-groceries"><ShoppingBasket size={19} /></Link>
        </div>
      </header>

      <nav className="home-quick-actions" aria-label="Kitchen actions">
        <Link href="/groceries/plan" className="home-action-chip" data-testid="home-plan-groceries"><ListChecks size={17} />Plan groceries</Link>
        <Link href="/assistant" className="home-action-chip" aria-label="Ask Tally" data-testid="home-ask-tally"><Sparkles size={17} />Ask Tally</Link>
      </nav>

      <ErrorNotice onRetry={kitchen.reload}>{kitchen.error}</ErrorNotice>

      <section className="home-section home-groceries-section" aria-labelledby="home-grocery-heading">
        <div className="home-section-heading">
          <h2 id="home-grocery-heading">Recent groceries</h2>
          <Link href="/groceries" className="home-section-link">All lists<ChevronRight size={16} /></Link>
        </div>
        {!canUseKitchen || kitchen.loading
          ? <div className="home-grocery-skeleton" aria-label="Loading latest grocery list"><span /><span /><span /></div>
          : latestList
            ? <Link className="home-grocery-card" href={`/groceries/${latestList.id}`} data-testid={`home-list-${latestList.id}`}>
                <div className="home-grocery-card-head">
                  <span className="home-icon-badge"><ShoppingBasket size={18} /></span>
                  <span className="home-grocery-title"><strong>{latestList.name}</strong><small>{latestList.items?.length || 0} items</small></span>
                  <span className="home-grocery-progress">{latestList.items?.filter((item) => item.checked).length || 0}<small>in cart</small></span>
                  <ChevronRight size={18} className="home-card-chevron" />
                </div>
                {latestList.items?.length > 0
                  ? <ul className="home-grocery-preview">
                      {latestList.items.slice(0, 3).map((item) => <li key={item.id}>
                        <span>{item.name}</span>
                        {(item.amount || item.unit) && <small>{[item.amount, item.unit].filter(Boolean).join(' ')}</small>}
                        {item.checked && <small className="home-grocery-item-status">In cart</small>}
                      </li>)}
                      {latestList.items.length > 3 && <li className="home-grocery-more">+{latestList.items.length - 3} more items</li>}
                    </ul>
                  : <p className="home-list-empty-copy">No items in this list yet.</p>}
              </Link>
            : <div className="home-empty-collection">
                <span className="home-icon-badge"><ShoppingBasket size={18} /></span>
                <span><strong>No grocery list yet</strong><small>Plan one when you’re ready.</small></span>
                <Link href="/groceries/plan" className="home-empty-link">Plan groceries<ChevronRight size={16} /></Link>
              </div>}
      </section>

      <section className="home-section home-recipes-section" aria-labelledby="home-recipe-heading">
        <div className="home-section-heading">
          <h2 id="home-recipe-heading">Recent recipes</h2>
          <Link href="/cookbook" className="home-section-link">Cookbook<ChevronRight size={16} /></Link>
        </div>
        <Link href="/cookbook/new" className="home-add-recipe-tile" data-testid="home-add-recipe">
          <span className="home-icon-badge"><Plus size={20} /></span>
          <strong>Add recipe</strong>
          <ChevronRight size={18} className="home-card-chevron" />
        </Link>
        {!canUseKitchen || kitchen.loading
          ? <div className="home-recipe-rail" aria-label="Loading recent recipes"><div className="home-recipe-skeleton" /><div className="home-recipe-skeleton" /></div>
          : recentRecipes.length
            ? <div className="home-recipe-rail" aria-label="Recent saved recipes">
                {recentRecipes.map((recipe, index) => {
                  const ingredients = (recipe.ingredients || []).filter((item) => item.name?.trim())
                  return <Link key={recipe.id} className="home-recipe-card" href={`/cookbook/${recipe.id}`} data-testid={`home-recipe-${recipe.id}`}>
                    <div className="home-card-topline">
                      <span className="home-icon-badge"><BookOpen size={18} /></span>
                      <span className="home-card-rank">{index === 0 ? 'Latest recipe' : 'Saved recipe'}</span>
                      <ChevronRight size={18} className="home-card-chevron" />
                    </div>
                    <strong className="home-recipe-title">{recipe.title}</strong>
                    <span className="home-recipe-serving">{recipe.servings} servings{recipe.prepMinutes != null ? ` · ${recipe.prepMinutes} min prep` : ''}</span>
                    {!!ingredients.length && <span className="home-ingredient-preview">
                      <span className="home-preview-label">Ingredients</span>
                      <span className="home-ingredient-names">{ingredients.slice(0, 3).map((item) => item.name).join(' · ')}</span>
                    </span>}
                  </Link>
                })}
              </div>
            : <div className="home-quiet-empty" data-testid="home-recent-recipes-empty">
                <span className="home-empty-dot" aria-hidden="true" />
                <p>Your recent recipes will appear here.</p>
              </div>}
      </section>

      <section className="home-section home-recommendations-section" aria-labelledby="home-recommendations-heading">
        <div className="home-section-heading">
          <h2 id="home-recommendations-heading">Most opened</h2>
          <Link href="/cookbook" className="home-section-link">Cookbook<ChevronRight size={16} /></Link>
        </div>
        {!canUseKitchen || kitchen.loading
          ? <div className="home-recommendations-skeleton" aria-label="Loading most opened recipes"><span /><span /></div>
          : recommendations.length
            ? <div className="home-recommendation-list" aria-label="Most opened recipes">
                {recommendations.map(({ recipe, openCount }) => (
                  <Link key={recipe.id} className="home-recommendation-row" href={`/cookbook/${recipe.id}`} data-testid={`home-recommendation-${recipe.id}`}>
                    <span className="home-icon-badge"><BookOpen size={18} /></span>
                    <span className="home-recommendation-copy">
                      <strong>{recipe.title}</strong>
                      <small>Opened {openCount} {openCount === 1 ? 'time' : 'times'}</small>
                    </span>
                    <ChevronRight size={18} className="home-card-chevron" />
                  </Link>
                ))}
              </div>
            : <div className="home-quiet-empty" data-testid="home-recommendations-empty">
                <span className="home-empty-dot" aria-hidden="true" />
                <p>Your most-opened recipes will appear here.</p>
              </div>}
      </section>

    </div>
  )
}

function Cookbook({ kitchen, canUseKitchen, user }) {
  const queryKey = `tally-search:${user?.id || 'signed-out'}`
  const [query, setQuery] = useState(() => sessionStorage.getItem(queryKey) || '')
  const [searchOpen, setSearchOpen] = useState(() => Boolean(sessionStorage.getItem(queryKey)))
  const searchInputRef = useRef(null)
  const searchToggleRef = useRef(null)
  useEffect(() => { sessionStorage.setItem(queryKey, query) }, [query, queryKey])
  const matches = useMemo(() => kitchen.recipes.filter((recipe) => `${recipe.title} ${recipe.description || ''} ${(recipe.ingredients || []).map((item) => item.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [kitchen.recipes, query])
  const toggleSearch = () => {
    if (searchOpen) {
      flushSync(() => {
        setQuery('')
        setSearchOpen(false)
      })
      searchToggleRef.current?.focus()
    } else {
      // Keep focus in the tap event so iOS can open the software keyboard.
      flushSync(() => setSearchOpen(true))
      searchInputRef.current?.focus({ preventScroll: true })
    }
  }
  return <div className="page cookbook-page">
    <header className="cookbook-native-header">
      <button ref={searchToggleRef} type="button" className="cookbook-search-toggle" onClick={toggleSearch} aria-label={searchOpen ? 'Close recipe search' : 'Search recipes'} aria-expanded={searchOpen} aria-controls="cookbook-search-region" data-testid="cookbook-search-toggle"><Search size={19} /></button>
      <h1>Cookbook</h1>
      <Link className="cookbook-add-button" href="/cookbook/new" aria-label="Add recipe" data-testid="cookbook-add-recipe"><Plus size={21} /></Link>
    </header>
    <div id="cookbook-search-region" className={`cookbook-search-region ${searchOpen ? 'is-open' : ''}`} aria-hidden={!searchOpen} inert={!searchOpen}>
      <label className="cookbook-search">
        <Search size={19} aria-hidden="true" />
        <span className="sr-only">Search recipes and ingredients</span>
        <input ref={searchInputRef} type="search" enterKeyHint="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); toggleSearch() } }} placeholder="Search recipes or ingredients" disabled={!searchOpen} data-testid="cookbook-search" />
        <button type="button" className={`cookbook-clear-search ${query ? 'visible' : ''}`} onClick={() => setQuery('')} aria-label="Clear search" disabled={!query || !searchOpen} data-testid="cookbook-clear-search"><X size={17} /></button>
      </label>
    </div>
    <ErrorNotice onRetry={kitchen.reload}>{kitchen.error}</ErrorNotice>
    {!canUseKitchen || kitchen.loading
      ? <div className="cookbook-skeleton" aria-label="Loading your recipes"><span /><span /><span /></div>
      : matches.length
        ? <>
            <p className="cookbook-result-count" aria-live="polite">{matches.length} {matches.length === 1 ? 'recipe' : 'recipes'}</p>
            <div className="cookbook-card-grid" aria-label="Saved recipes">{matches.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
          </>
        : kitchen.error
          ? <div className="cookbook-load-error"><BookOpen size={22} /><p>Your recipes couldn’t be loaded.</p></div>
          : query
            ? <EmptyState icon={<Search size={22} />} title="No matching recipes" detail={`No recipes match “${query}”. Try another name or ingredient.`} />
            : <EmptyState icon={<BookOpen size={23} />} title="No recipes yet" detail="Your saved recipes will live here." />}
  </div>
}
function RecipeCard({ recipe }) {
  const ingredientCount = (recipe.ingredients || []).length
  const ingredients = (recipe.ingredients || []).map((item) => item.name?.trim()).filter(Boolean)
  return <Link className="cookbook-recipe-card" href={`/cookbook/${recipe.id}`} aria-label={`Open ${recipe.title}`} data-testid={`recipe-${recipe.id}`}>
    <span className="cookbook-card-media" aria-hidden="true">
      <span className="cookbook-no-photo-symbol"><BookOpen size={25} /></span>
      <span className="cookbook-no-photo-label">No photo</span>
      <ChevronRight size={17} className="cookbook-card-chevron" />
    </span>
    <span className="cookbook-card-body">
      <strong className="cookbook-card-title">{recipe.title}</strong>
      {recipe.description && <span className="cookbook-card-description">{recipe.description}</span>}
      <span className="cookbook-card-metadata">
        {recipe.servings != null && <span>{recipe.servings} servings</span>}
        {recipe.prepMinutes != null && <span>Prep {recipe.prepMinutes} min</span>}
        {recipe.cookMinutes != null && <span>Cook {recipe.cookMinutes} min</span>}
      </span>
      <span className="cookbook-card-ingredients">
        <span>{ingredientCount} {ingredientCount === 1 ? 'ingredient' : 'ingredients'}</span>
        {ingredients.length > 0 && <span className="cookbook-card-ingredient-names">{ingredients.slice(0, 3).join(' · ')}{ingredients.length > 3 ? ' · …' : ''}</span>}
      </span>
    </span>
  </Link>
}
function EmptyState({ icon, title, detail, action }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h2>{title}</h2><p>{detail}</p>{action && <div className="empty-action">{action}</div>}</div>
}

function RecipeDetail({ recipe, kitchen, canUseKitchen, user }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [, setLocation] = useLocation()
  const recordedVisit = useRef(null)
  const activityOwner = user?.id || 'guest'
  useEffect(() => {
    if (!canUseKitchen || !recipe?.id) return
    const visit = `${activityOwner}:${recipe.id}`
    if (recordedVisit.current === visit) return
    recordedVisit.current = visit
    recordRecipeOpen(localStorage, activityOwner, recipe.id)
    window.dispatchEvent(new Event(RECIPE_ACTIVITY_EVENT))
  }, [activityOwner, canUseKitchen, recipe?.id])
  if (!canUseKitchen) return <div className="page"><LoadingRows /></div>
  if (!recipe && kitchen.loading) return <div className="page"><LoadingRows /></div>
  if (!recipe) return <div className="page"><EmptyState icon={<BookOpen size={23} />} title="Recipe not found" detail="It may have been removed, or your cookbook hasn’t loaded yet." action={<Link className="button button-secondary" href="/cookbook">Back to cookbook</Link>} /></div>
  const remove = async () => {
    setBusy(true)
    try { await kitchen.request(`/recipes/${recipe.id}`, { method: 'DELETE' }); kitchen.removeRecipe(recipe.id); setLocation('/cookbook') }
    catch (err) { kitchen.setError(err.message || 'This recipe could not be deleted.') }
    finally { setBusy(false); setConfirmDelete(false) }
  }
  return <div className="page detail-page">
    <div className="detail-actions"><span className="eyebrow">Saved recipe</span><div><Link className="icon-button" href={`/cookbook/${recipe.id}/edit`} aria-label="Edit recipe"><MoreHorizontal size={22} /></Link><button className="icon-button danger-icon" type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete recipe"><Trash2 size={19} /></button></div></div>
    <h1 className="detail-title">{recipe.title}</h1>
    {recipe.description && <p className="detail-description">{recipe.description}</p>}
    <div className="recipe-meta"><span><UserRound size={16} /> {recipe.servings} servings</span>{recipe.prepMinutes != null && <span><Clock3 size={16} /> {recipe.prepMinutes} min prep</span>}{recipe.cookMinutes != null && <span><CookingPot size={16} /> {recipe.cookMinutes} min cook</span>}</div>
    <section className="recipe-section"><h2>Ingredients</h2><div className="ingredient-display">{(recipe.ingredients || []).map((item, index) => <div className="ingredient-display-row" key={`${item.name}-${index}`}><span>{item.name}</span><strong>{item.amount} {item.unit}</strong></div>)}</div></section>
    <section className="recipe-section"><h2>Method</h2><ol className="method-list">{(recipe.steps || []).map((step, index) => <li key={`${step}-${index}`}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section>
    {recipe.notes && <section className="recipe-note"><p className="eyebrow">A note to remember</p><p>{recipe.notes}</p></section>}
    <p className="saved-date">Saved {dateLabel(recipe.createdAt)}</p>
    <ErrorNotice>{kitchen.error}</ErrorNotice>
    {confirmDelete && <ConfirmSheet title="Delete this recipe?" detail="It will be removed from your cookbook. This can’t be undone." cancel={() => setConfirmDelete(false)} confirm={remove} busy={busy} destructive />}
  </div>
}

function ConfirmSheet({ title, detail, cancel, confirm, busy, destructive }) {
  const sheetRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    sheetRef.current?.querySelector('button')?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) cancel()
      if (event.key === 'Tab' && sheetRef.current) {
        const buttons = [...sheetRef.current.querySelectorAll('button:not(:disabled)')]
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus() }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.() }
  }, [busy, cancel])
  return <div className="modal-scrim" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) cancel() }}><section ref={sheetRef} className="confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><span className={`confirm-symbol ${destructive ? 'confirm-danger' : ''}`}>{destructive ? <Trash2 size={22} /> : <CircleHelp size={22} />}</span><h2 id="confirm-title">{title}</h2><p>{detail}</p><button type="button" className={`button ${destructive ? 'button-danger' : 'button-primary'} button-full`} disabled={busy} onClick={confirm}>{busy ? 'Please wait…' : destructive ? 'Delete' : 'Confirm'}</button><button type="button" className="button button-secondary button-full" onClick={cancel} disabled={busy}>Keep it</button></section></div>
}

function RecipeEditor({ kitchen, canUseKitchen, recipe, user, editId }) {
  const storageKey = `tally-recipe-draft:${user?.id || 'signed-out'}:${editId || 'new'}`
  const approvalRequestId = useRef(sessionStorage.getItem(`${storageKey}:request`) || idForRequest())
  const restoredDraft = useRef(false)
  const initializedRecipe = useRef(false)
  const [ready, setReady] = useState(!editId)
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        restoredDraft.current = true
        return JSON.parse(saved)
      }
    } catch {}
    return recipe ? { ...recipe, ingredients: recipe.ingredients.map((item) => ({ ...item })), steps: [...recipe.steps] } : emptyRecipe()
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [, setLocation] = useLocation()
  useEffect(() => {
    if (!editId) { setReady(true); return }
    if (kitchen.loading) return
    if (!recipe) { setReady(true); return }
    if (restoredDraft.current) {
      initializedRecipe.current = true
    } else if (!initializedRecipe.current) {
      setForm({ ...recipe, ingredients: recipe.ingredients.map((item) => ({ ...item })), steps: [...recipe.steps] })
      initializedRecipe.current = true
    }
    setReady(true)
  }, [editId, kitchen.loading, recipe])
  useEffect(() => { if (ready) sessionStorage.setItem(storageKey, JSON.stringify(form)) }, [form, ready, storageKey])
  useEffect(() => { sessionStorage.setItem(`${storageKey}:request`, approvalRequestId.current) }, [storageKey])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const updateRow = (type, index, key, value) => setForm((current) => ({ ...current, [type]: current[type].map((row, i) => i === index ? { ...row, [key]: value } : row) }))
  const payload = () => ({
    title: form.title.trim(), description: form.description.trim(), servings: Number(form.servings),
    prepMinutes: form.prepMinutes === '' || form.prepMinutes == null ? null : Number(form.prepMinutes),
    cookMinutes: form.cookMinutes === '' || form.cookMinutes == null ? null : Number(form.cookMinutes),
    ingredients: form.ingredients.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), amount: Number(item.amount), unit: item.unit.trim() })),
    steps: form.steps.map((step) => step.trim()).filter(Boolean), notes: form.notes.trim(),
  })
  const submit = async (event) => {
    event.preventDefault()
    const clean = payload()
    if (!clean.title || !clean.servings || clean.ingredients.length === 0 || clean.ingredients.some((item) => !item.amount || !item.unit) || !clean.steps.length) { setError('Add a title, servings, complete ingredient amounts and units, and at least one method step.'); return }
    setBusy(true); setError('')
    try {
      const saved = recipe ? await kitchen.request(`/recipes/${recipe.id}`, { method: 'PUT', body: { recipe: clean } }) : await kitchen.request('/recipes/approve', { method: 'POST', body: { recipe: clean, approved: true, requestId: approvalRequestId.current } })
      kitchen.replaceRecipe(saved)
      sessionStorage.removeItem(storageKey)
      sessionStorage.removeItem(`${storageKey}:request`)
      setLocation(`/cookbook/${saved.id}`)
    } catch (err) { setError(err.message || 'Your recipe could not be saved. Your changes are still here.') }
    finally { setBusy(false) }
  }
  if (!canUseKitchen) return <div className="page"><LoadingRows /></div>
  if (editId && !ready) return <div className="page"><LoadingRows /></div>
  if (editId && ready && !recipe) return <div className="page"><EmptyState icon={<BookOpen size={23} />} title="Recipe not found" detail="It may have been removed, or your cookbook hasn’t loaded yet." action={<Link className="button button-secondary" href="/cookbook">Back to cookbook</Link>} /></div>
  return <div className="page editor-page">
    <ScreenTitle eyebrow={recipe ? 'Make it yours' : 'Add to your cookbook'} title={recipe ? 'Edit recipe' : 'A recipe of your own'} detail="Use what you know. Unknown details can stay unknown." />
    <form className="recipe-form" onSubmit={submit}>
      <label className="field-label">Recipe name<input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Sunday tomato sauce" /></label>
      <label className="field-label">A little about it <span className="optional">Optional</span><textarea rows="2" value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="What makes this one yours?" /></label>
      <div className="form-section-head"><h2>Ingredients</h2><button type="button" className="text-button add-inline" onClick={() => update('ingredients', [...form.ingredients, { name: '', amount: '', unit: '' }])}><Plus size={16} /> Add ingredient</button></div>
      <div className="ingredient-editor">{form.ingredients.map((item, index) => <div className="ingredient-input-row" key={index}><input aria-label={`Ingredient ${index + 1}`} value={item.name} onChange={(e) => updateRow('ingredients', index, 'name', e.target.value)} placeholder="Ingredient" /><input aria-label={`Amount for ingredient ${index + 1}`} type="number" min="0" step="any" value={item.amount} onChange={(e) => updateRow('ingredients', index, 'amount', e.target.value)} placeholder="Amount" /><input aria-label={`Unit for ingredient ${index + 1}`} value={item.unit} onChange={(e) => updateRow('ingredients', index, 'unit', e.target.value)} placeholder="Unit" />{form.ingredients.length > 1 && <button type="button" className="remove-row" aria-label={`Remove ingredient ${index + 1}`} onClick={() => update('ingredients', form.ingredients.filter((_, i) => i !== index))}><X size={16} /></button>}</div>)}</div>
      <label className="field-label">Servings<input type="number" min="1" step="1" required value={form.servings} onChange={(e) => update('servings', e.target.value)} /></label>
      <div className="field-pair"><label className="field-label">Prep minutes <span className="optional">Optional</span><input type="number" min="0" value={form.prepMinutes ?? ''} onChange={(e) => update('prepMinutes', e.target.value)} placeholder="—" /></label><label className="field-label">Cook minutes <span className="optional">Optional</span><input type="number" min="0" value={form.cookMinutes ?? ''} onChange={(e) => update('cookMinutes', e.target.value)} placeholder="—" /></label></div>
      <div className="form-section-head"><h2>Method</h2><button type="button" className="text-button add-inline" onClick={() => update('steps', [...form.steps, ''])}><Plus size={16} /> Add step</button></div>
      <div className="steps-editor">{form.steps.map((step, index) => <label className="step-input-row" key={index}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><textarea aria-label={`Method step ${index + 1}`} rows="2" value={step} onChange={(e) => update('steps', form.steps.map((value, i) => i === index ? e.target.value : value))} placeholder="What happens next?" />{form.steps.length > 1 && <button type="button" className="remove-row" aria-label={`Remove method step ${index + 1}`} onClick={() => update('steps', form.steps.filter((_, i) => i !== index))}><X size={16} /></button>}</label>)}</div>
      <label className="field-label">Notes to your future self <span className="optional">Optional</span><textarea rows="3" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} placeholder="A substitution, a trick, or what to remember next time…" /></label>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="form-actions"><button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? <><LoaderCircle size={18} className="spin" /> Saving…</> : <><Check size={18} /> {recipe ? 'Save changes' : 'Approve & Save recipe'}</>}</button><Link className="button button-secondary button-full" href={recipe ? `/cookbook/${recipe.id}` : '/cookbook'}>Cancel</Link></div>
    </form>
  </div>
}

function Assistant({ kitchen, isSignedIn, user }) {
  const chatKey = `tally-chat:${user?.id || 'signed-out'}`
  const draftKey = `tally-draft:${user?.id || 'signed-out'}`
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(chatKey) || '[]') } catch { return [] }
  })
  const [draft, setDraft] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(draftKey) || 'null') } catch { return null }
  })
  const [input, setInput] = useState(() => sessionStorage.getItem(`${chatKey}:input`) || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedNotice, setSavedNotice] = useState('')
  const [savedRecipeId, setSavedRecipeId] = useState('')
  const feedRef = useRef(null)
  const approvalRequestId = useRef(sessionStorage.getItem(`${draftKey}:request`) || idForRequest())
  const latestRecipe = kitchen.recipes[0]
  const latestList = kitchen.lists[0]
  useEffect(() => { sessionStorage.setItem(chatKey, JSON.stringify(messages)) }, [messages, chatKey])
  useEffect(() => {
    if (input) sessionStorage.setItem(`${chatKey}:input`, input)
    else sessionStorage.removeItem(`${chatKey}:input`)
  }, [chatKey, input])
  useEffect(() => { if (draft) sessionStorage.setItem(draftKey, JSON.stringify(draft)); else sessionStorage.removeItem(draftKey) }, [draft, draftKey])
  useEffect(() => { if (draft) sessionStorage.setItem(`${draftKey}:request`, approvalRequestId.current); else sessionStorage.removeItem(`${draftKey}:request`) }, [draft, draftKey])
  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight }, [messages, busy])

  const send = async (event) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || busy) return
    const previous = messages
    const outgoing = [...previous, { role: 'user', content }]
    setMessages(outgoing); setInput(''); setBusy(true); setError(''); setSavedNotice('')
    try {
      const safeDraft = assistantDraftPayload(draft)
      const result = await api('/assistant', { method: 'POST', body: { messages: outgoing, ...(safeDraft ? { draft: safeDraft } : {}) } })
      if (result.draft && !draft) approvalRequestId.current = idForRequest()
      setMessages([...outgoing, { role: 'assistant', content: result.reply }])
      setDraft(result.draft || null)
    } catch (err) {
      setError(err.message || 'Tally could not reply. Your message is still here.')
      setMessages(previous)
      sessionStorage.setItem(`${chatKey}:input`, content)
      setInput(content)
    } finally { setBusy(false) }
  }
  const editDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const editIngredient = (index, key, value) => setDraft((current) => ({ ...current, ingredients: current.ingredients.map((item, i) => i === index ? { ...item, [key]: value } : item) }))
  const editStep = (index, value) => setDraft((current) => ({ ...current, steps: current.steps.map((step, i) => i === index ? value : step) }))
  const approve = async () => {
    if (!draft || busy) return
    const clean = { ...draft, title: draft.title.trim(), servings: Number(draft.servings), prepMinutes: draft.prepMinutes == null || draft.prepMinutes === '' ? null : Number(draft.prepMinutes), cookMinutes: draft.cookMinutes == null || draft.cookMinutes === '' ? null : Number(draft.cookMinutes), ingredients: (draft.ingredients || []).map((i) => ({ ...i, amount: Number(i.amount) })), steps: (draft.steps || []).map((s) => s.trim()).filter(Boolean) }
    if (!clean.title || !clean.servings || !clean.ingredients.length || clean.ingredients.some((i) => !i.name.trim() || !i.amount || !i.unit.trim()) || !clean.steps.length) { setError('Finish the recipe details before approving. Tally will not guess missing amounts.'); return }
    setBusy(true); setError(''); setSavedNotice('')
    try {
      const saved = await kitchen.request('/recipes/approve', { method: 'POST', body: { recipe: clean, approved: true, requestId: approvalRequestId.current } })
      kitchen.replaceRecipe(saved); setDraft(null); sessionStorage.removeItem(`${draftKey}:request`); approvalRequestId.current = idForRequest(); setSavedRecipeId(saved.id); setSavedNotice(`Saved “${saved.title}”${isSignedIn ? ' to your cookbook' : ' on this device'}.`)
    } catch (err) { setError(err.message || 'The recipe was not saved. Your draft is safe; try again.') }
    finally { setBusy(false) }
  }
  return <div className="page assistant-page">
    <header className="assistant-native-header"><span aria-hidden="true" /><h1>AI Assistant</h1><span aria-hidden="true" /></header>
    <nav className="assistant-shortcuts" aria-label="Your kitchen">
      <Link href={latestRecipe ? `/cookbook/${latestRecipe.id}` : '/cookbook'} className="shortcut-chip" data-testid="assistant-latest-recipe"><BookOpen size={18} /><span><small>{latestRecipe ? 'Latest recipe' : 'Cookbook'}</small><strong>{latestRecipe?.title || 'Browse recipes'}</strong></span><ChevronRight size={16} /></Link>
      <Link href={latestList ? `/groceries/${latestList.id}` : '/groceries'} className="shortcut-chip" data-testid="assistant-latest-list"><ShoppingBasket size={18} /><span><small>{latestList ? 'Latest grocery list' : 'Groceries'}</small><strong>{latestList?.name || 'View your lists'}</strong></span><ChevronRight size={16} /></Link>
    </nav>
    <>
      <section className="conversation-panel" aria-label="Text conversation">
        <div className="conversation-feed" ref={feedRef} aria-live="polite">
          {messages.length === 0 && <div className="assistant-welcome"><span className="assistant-orbit"><Sparkles size={21} /></span><div><strong>What are we cooking?</strong></div></div>}
          {messages.map((message, index) => <div className={`message message-${message.role}`} key={`${index}-${message.role}`}><span className="message-label">{message.role === 'assistant' ? 'Tally' : 'You'}</span><p>{message.content}</p></div>)}
          {busy && <div className="typing-line"><span /><span /><span /><span className="sr-only">Tally is thinking</span></div>}
        </div>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {savedNotice && <p className="success-notice" role="status"><CheckCircle2 size={17} />{savedNotice}<Link href={`/cookbook/${savedRecipeId}`}>Open recipe</Link></p>}
        {draft && <section className="draft-card">
          <div className="draft-top"><div><span className="draft-status"><span /> Draft · not saved</span><h2>Review this recipe</h2></div><button type="button" className="icon-button" aria-label="Dismiss recipe draft" onClick={() => setDraft(null)}><X size={18} /></button></div>
          <p className="draft-explainer">Make any corrections. Nothing enters your cookbook until you approve it.</p>
          <label className="field-label">Recipe name<input value={draft.title || ''} onChange={(e) => editDraft('title', e.target.value)} /></label>
          <label className="field-label">Description<textarea rows="2" value={draft.description || ''} onChange={(e) => editDraft('description', e.target.value)} /></label>
          <label className="field-label servings-field">Servings<input type="number" min="1" value={draft.servings || ''} onChange={(e) => editDraft('servings', e.target.value)} /></label>
          <div className="draft-subhead"><h3>Ingredients</h3><button type="button" className="text-button" onClick={() => editDraft('ingredients', [...(draft.ingredients || []), { name: '', amount: '', unit: '' }])}><Plus size={15} /> Add</button></div>
          {(draft.ingredients || []).map((item, index) => <div className="ingredient-input-row draft-ingredient" key={index}><input aria-label={`Draft ingredient ${index + 1}`} value={item.name || ''} onChange={(e) => editIngredient(index, 'name', e.target.value)} placeholder="Ingredient" /><input aria-label={`Draft amount ${index + 1}`} type="number" min="0" step="any" value={item.amount ?? ''} onChange={(e) => editIngredient(index, 'amount', e.target.value)} placeholder="Amount" /><input aria-label={`Draft unit ${index + 1}`} value={item.unit || ''} onChange={(e) => editIngredient(index, 'unit', e.target.value)} placeholder="Unit" /></div>)}
          <div className="draft-subhead"><h3>Method</h3><button type="button" className="text-button" onClick={() => editDraft('steps', [...(draft.steps || []), ''])}><Plus size={15} /> Add</button></div>
          {(draft.steps || []).map((step, index) => <textarea className="draft-step" aria-label={`Draft method step ${index + 1}`} key={index} rows="2" value={step} onChange={(e) => editStep(index, e.target.value)} placeholder={`Step ${index + 1}`} />)}
          <label className="field-label">Notes<textarea rows="2" value={draft.notes || ''} onChange={(e) => editDraft('notes', e.target.value)} placeholder="Optional notes" /></label>
          <div className="draft-actions"><button type="button" className="button button-primary button-full" onClick={approve} disabled={busy}>{busy ? 'Saving…' : <><Check size={18} /> Approve &amp; Save</>}</button><button type="button" className="button button-secondary button-full" onClick={() => { setInput('Could we adjust this recipe?'); document.getElementById('assistant-message')?.focus() }}>Continue conversation</button></div>
        </section>}
        {!isSignedIn && <p className="assistant-device-note">Messages use online AI. Recipes save on this device.</p>}
        <form className="message-composer" onSubmit={send}><label htmlFor="assistant-message" className="sr-only">Message Tally</label><textarea id="assistant-message" rows="1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form.requestSubmit() } }} placeholder="Message Tally…" /><button className="send-button" type="submit" disabled={!input.trim() || busy} aria-label="Send message"><Send size={19} /></button></form>
      </section>
      <p className="quiet-note"><CheckCircle2 size={15} /> Recipes stay drafts until you choose Approve &amp; Save.</p>
    </>
  </div>
}

function Groceries({ kitchen, canUseKitchen }) {
  const lists = kitchen.lists || []
  const latest = lists[0]
  const groupedLists = new Map()
  lists.slice(1).forEach((list) => {
    const date = dateLabel(list.createdAt) || 'Date unavailable'
    if (!groupedLists.has(date)) groupedLists.set(date, [])
    groupedLists.get(date).push(list)
  })
  const earlierGroups = [...groupedLists.entries()]
  const inCartCount = (list) => (list.items || []).filter((item) => item.checked).length
  const itemCount = (list) => (list.items || []).length

  return <div className="page groceries-page">
    <header className="groceries-native-header">
      <span aria-hidden="true" />
      <h1>Groceries</h1>
      <Link href="/groceries/plan" className="groceries-add-button" aria-label="Plan a grocery list" data-testid="groceries-plan">
        <Plus size={21} />
      </Link>
    </header>
    <ErrorNotice onRetry={kitchen.reload}>{kitchen.error}</ErrorNotice>
    {!canUseKitchen || kitchen.loading
      ? <div className="groceries-skeleton" aria-label="Loading grocery lists"><span /><span /><span /></div>
      : latest
        ? <>
            <section className="groceries-latest-section" aria-labelledby="groceries-latest-heading">
              <h2 className="groceries-section-heading" id="groceries-latest-heading">Latest list</h2>
              <Link className="groceries-latest-card" href={`/groceries/${latest.id}`} data-testid={`groceries-list-${latest.id}`}>
                <span className="groceries-latest-topline">{dateLabel(latest.createdAt) || 'Date unavailable'}<ChevronRight size={17} /></span>
                <span className="groceries-latest-name">{latest.name}</span>
                <span className="groceries-latest-progress">{inCartCount(latest)} of {itemCount(latest)} in cart</span>
                {itemCount(latest) > 0
                  ? <span className="groceries-preview-list">
                      {latest.items.slice(0, 3).map((item) => <span className="groceries-preview-row" key={item.id}>
                        <span className={`groceries-preview-mark ${item.checked ? 'is-checked' : ''}`} aria-hidden="true">{item.checked && <Check size={14} />}</span>
                        <span className="groceries-preview-name">{item.name}</span>
                        {(item.amount || item.unit) && <span className="groceries-preview-amount">{[item.amount, item.unit].filter(Boolean).join(' ')}</span>}
                        {item.checked && <span className="groceries-preview-cart">In cart</span>}
                      </span>)}
                      {itemCount(latest) > 3 && <span className="groceries-preview-more">{itemCount(latest) - 3} more items</span>}
                    </span>
                  : <span className="groceries-preview-empty">No items in this list.</span>}
              </Link>
            </section>
            {earlierGroups.length > 0 && <section className="groceries-history" aria-labelledby="groceries-history-heading">
              <h2 className="groceries-section-heading" id="groceries-history-heading">Earlier lists</h2>
              {earlierGroups.map(([date, group]) => <section className="groceries-date-group" key={date} aria-label={date}>
                <h3>{date}</h3>
                <div className="groceries-history-group">
                  {group.map((list) => <Link className="groceries-history-row" href={`/groceries/${list.id}`} key={list.id} data-testid={`groceries-list-${list.id}`}>
                    <span className="groceries-history-symbol"><ShoppingBasket size={18} /></span>
                    <span className="groceries-history-copy"><strong>{list.name}</strong><small>{inCartCount(list)} of {itemCount(list)} in cart</small></span>
                    <ChevronRight size={17} className="groceries-history-chevron" />
                  </Link>)}
                </div>
              </section>)}
            </section>}
          </>
        : kitchen.error
          ? <div className="groceries-empty-state"><span className="groceries-empty-symbol"><ShoppingBasket size={22} /></span><h2>Lists unavailable</h2><p>Your saved lists couldn’t be loaded.</p></div>
          : <div className="groceries-empty-state"><span className="groceries-empty-symbol"><ShoppingBasket size={22} /></span><h2>No saved lists</h2><p>Plan a list when you’re ready.</p></div>}
  </div>
}

function GroceryDetail({ kitchen, list, canUseKitchen }) {
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [, setLocation] = useLocation()
  const checkedCount = list?.items?.filter((item) => item.checked).length || 0
  if (!canUseKitchen) return <div className="page"><LoadingRows /></div>
  if (!list && kitchen.loading) return <div className="page"><LoadingRows /></div>
  if (!list) return <div className="page"><EmptyState icon={<ShoppingBasket size={22} />} title="List not found" detail="This list may have been removed." action={<Link className="button button-secondary" href="/groceries">Back to groceries</Link>} /></div>
  const toggle = async (item) => {
    setBusyId(item.id); setError('')
    try { const updated = await kitchen.request(`/lists/${list.id}/items/${item.id}`, { method: 'PATCH', body: { checked: !item.checked } }); kitchen.replaceList(updated) }
    catch (err) { setError(err.message || 'Could not update this item. Try again.') }
    finally { setBusyId('') }
  }
  const remove = async () => {
    setDeleting(true); setError('')
    try { await kitchen.request(`/lists/${list.id}`, { method: 'DELETE' }); kitchen.removeList(list.id); setLocation('/groceries') }
    catch (err) { setError(err.message || 'This list could not be deleted.') }
    finally { setDeleting(false); setConfirmDelete(false) }
  }
  return <div className="page list-detail-page">
    <div className="detail-actions"><span className="eyebrow">Grocery list · {dateLabel(list.createdAt)}</span><button type="button" className="icon-button danger-icon" aria-label="Delete list" onClick={() => setConfirmDelete(true)}><Trash2 size={19} /></button></div>
    <h1 className="detail-title">{list.name}</h1>
    <div className="shopping-progress"><div className="progress-copy"><strong>{checkedCount} of {list.items?.length || 0}</strong><span>in your cart</span></div><div className="progress-track"><span style={{ transform: `scaleX(${list.items?.length ? checkedCount / list.items.length : 0})` }} /></div></div>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {list.warnings?.length > 0 && <div className="list-assumptions"><p className="eyebrow">Planning notes</p>{list.warnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>}
    <div className="checklist">{list.items?.map((item) => <button type="button" className={`grocery-item ${item.checked ? 'checked' : ''}`} key={item.id} onClick={() => toggle(item)} disabled={Boolean(busyId)} aria-pressed={item.checked} data-testid={`grocery-item-${item.id}`}><span className="check-control">{item.checked && <Check size={17} />}</span><span className="grocery-name">{item.name}</span><span className="grocery-amount">{item.amount} {item.unit}</span>{busyId === item.id && <LoaderCircle className="spin pending-icon" size={16} />}</button>)}</div>
    {list.items?.length === 0 && <EmptyState icon={<ListChecks size={22} />} title="This list is clear" detail="There are no items in this saved list." />}
    <p className="cart-disclaimer">Checking an item means it’s in your cart — not that it’s been purchased or added to inventory.</p>
    {confirmDelete && <ConfirmSheet title="Delete this list?" detail="This dated list and its checkmarks will be removed." cancel={() => setConfirmDelete(false)} confirm={remove} busy={deleting} destructive />}
  </div>
}

function GroceryPlanner({ kitchen, canUseKitchen, user }) {
  const planKey = `tally-grocery-plan:${user?.id || 'signed-out'}`
  const restoredPlan = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem(planKey) || 'null') } catch { return null }
  }, [planKey])
  const [selected, setSelected] = useState(() => restoredPlan?.selected || {})
  const [inventory, setInventory] = useState(() => restoredPlan?.inventory || [{ name: '', amount: '', unit: '' }])
  const [name, setName] = useState(() => restoredPlan?.name || 'Shopping list')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const approveRequestId = useRef(sessionStorage.getItem(`${planKey}:request`) || idForRequest())
  const [, setLocation] = useLocation()
  useEffect(() => { sessionStorage.setItem(planKey, JSON.stringify({ selected, inventory, name })) }, [planKey, selected, inventory, name])
  useEffect(() => { sessionStorage.setItem(`${planKey}:request`, approveRequestId.current) }, [planKey])
  const selections = Object.entries(selected).filter(([, value]) => value.enabled).map(([recipeId, value]) => ({ recipeId, servings: Number(value.servings) }))
  const cleanInventory = inventory.filter((item) => item.name.trim()).map((item) => ({ name: item.name.trim(), amount: Number(item.amount), unit: item.unit.trim() }))
  const setRecipe = (recipe, value) => { setSelected((current) => ({ ...current, [recipe.id]: { enabled: value, servings: current[recipe.id]?.servings || recipe.servings } })); setPreview(null) }
  const previewList = async () => {
    if (!selections.length) { setError('Choose at least one recipe to plan a list.'); return }
    if (cleanInventory.some((item) => !item.amount || !item.unit)) { setError('For each item you have on hand, add an amount and unit. Remove rows you do not need.'); return }
    setBusy(true); setError(''); setPreview(null)
    try { setPreview(await kitchen.request('/groceries/preview', { method: 'POST', body: { selections, inventory: cleanInventory } })) }
    catch (err) { setError(err.message || 'Could not prepare a preview. Your selections are still here.') }
    finally { setBusy(false) }
  }
  const approve = async () => {
    if (!preview || preview.warnings?.length) return
    setBusy(true); setError('')
    try {
      const list = await kitchen.request('/groceries/approve', { method: 'POST', body: { name: name.trim() || 'Shopping list', selections, inventory: cleanInventory, approved: true, requestId: approveRequestId.current, fingerprint: preview.fingerprint } })
      kitchen.replaceList(list); sessionStorage.removeItem(planKey); sessionStorage.removeItem(`${planKey}:request`); setLocation(`/groceries/${list.id}`)
    } catch (err) {
      if (err.status === 409) {
        setPreview(null)
        setError('Your recipes or inventory changed since this preview. Review a fresh list before approving.')
      } else setError(err.message || 'Your list was not saved. The plan is still here.')
    }
    finally { setBusy(false) }
  }
  if (!canUseKitchen) return <div className="page"><LoadingRows /></div>
  return <div className="page planner-page">
    <ScreenTitle eyebrow="Plan a list" title="What are we making?" detail="Choose the recipes for this trip. Tally will show a reviewable list before anything is saved." />
    <ErrorNotice>{error}</ErrorNotice>
    <section className="planner-section"><div className="planner-section-title"><span>01</span><div><h2>Choose recipes</h2><p>Only the meals you select are included.</p></div></div>
      {kitchen.loading ? <LoadingRows /> : kitchen.recipes.length ? <div className="select-recipes">{kitchen.recipes.map((recipe) => <div className={`select-recipe ${selected[recipe.id]?.enabled ? 'selected' : ''}`} key={recipe.id}>
        <label className="recipe-select-label"><input type="checkbox" checked={Boolean(selected[recipe.id]?.enabled)} onChange={(e) => setRecipe(recipe, e.target.checked)} /><span className="selection-check"><Check size={15} /></span><span className="select-recipe-copy"><strong>{recipe.title}</strong><small>Base recipe · {recipe.servings} servings</small></span></label>
        {selected[recipe.id]?.enabled && <label className="target-servings">Make for <input aria-label={`Servings for ${recipe.title}`} type="number" min="1" value={selected[recipe.id].servings} onChange={(e) => { setSelected((current) => ({ ...current, [recipe.id]: { ...current[recipe.id], servings: e.target.value } })); setPreview(null) }} /> servings</label>}
      </div>)}</div> : <EmptyState icon={<BookOpen size={21} />} title="No saved recipes yet" detail="Add a recipe to your cookbook first. Then you can plan a list around it." action={<Link className="button button-secondary" href="/cookbook/new">Add a recipe</Link>} />}
    </section>
    <section className="planner-section"><div className="planner-section-title"><span>02</span><div><h2>What’s already at home?</h2><p>Optional. Only comparable amounts are subtracted.</p></div></div>
       <div className="inventory-inputs">{inventory.map((item, index) => <div className="ingredient-input-row" key={index}><input aria-label={`Inventory item ${index + 1}`} value={item.name} onChange={(e) => { setInventory(inventory.map((v, i) => i === index ? { ...v, name: e.target.value } : v)); setPreview(null) }} placeholder="Ingredient" /><input aria-label={`Inventory amount ${index + 1}`} type="number" min="0" step="any" value={item.amount} onChange={(e) => { setInventory(inventory.map((v, i) => i === index ? { ...v, amount: e.target.value } : v)); setPreview(null) }} placeholder="Amount" /><input aria-label={`Inventory unit ${index + 1}`} value={item.unit} onChange={(e) => { setInventory(inventory.map((v, i) => i === index ? { ...v, unit: e.target.value } : v)); setPreview(null) }} placeholder="Unit" />{inventory.length > 1 && <button className="remove-row" type="button" aria-label="Remove inventory item" onClick={() => { setInventory(inventory.filter((_, i) => i !== index)); setPreview(null) }}><X size={16} /></button>}</div>)}<button type="button" className="text-button" onClick={() => { setInventory([...inventory, { name: '', amount: '', unit: '' }]); setPreview(null) }}><Plus size={16} /> Add what you have</button></div>
    </section>
    <button className="button button-primary button-full" type="button" onClick={previewList} disabled={busy || kitchen.loading || !kitchen.recipes.length}>{busy && !preview ? <><LoaderCircle size={18} className="spin" /> Preparing…</> : <>Review grocery list <ArrowRight size={18} /></>}</button>
    {preview && <section className="preview-card">
      <div className="draft-status"><span /> Review · not saved</div><h2>Your list, before it’s saved</h2><label className="field-label">List name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      {preview.warnings?.length > 0 && <div className="warning-box"><strong>Needs a little attention</strong>{preview.warnings.map((warning, i) => <p key={i}>{warning}</p>)}<small>Resolve planning notes before approving.</small></div>}
      <div className="preview-items">{(preview.items || []).map((item, i) => <div className="preview-item" key={item.id || `${item.name}-${i}`}><span>{item.name}</span><strong>{item.amount} {item.unit}</strong></div>)}</div>
      {preview.items?.length === 0 && <p className="preview-empty">Everything in these recipes appears to be covered by what you have.</p>}
      <button type="button" className="button button-primary button-full" onClick={approve} disabled={busy || (preview.warnings || []).length > 0}>{busy ? 'Saving list…' : <><Check size={18} /> Approve &amp; Save list</>}</button>
    </section>}
    <p className="quiet-note"><CircleHelp size={15} /> Your list is only saved after you approve it. Amounts are recalculated by Tally when saved.</p>
  </div>
}

function SettingsPage({ theme, setTheme, user, isSignedIn }) {
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Account'
  const appearanceOptions = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]
  const [activeSheet, setActiveSheet] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [, setLocation] = useLocation()
  const sheetRef = useRef(null)
  const searchRef = useRef(null)
  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else setLocation('/home')
  }
  useEffect(() => {
    if (activeSheet && sheetRef.current && !sheetRef.current.open) sheetRef.current.showModal()
  }, [activeSheet])
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])
  const openSearch = () => {
    if (searchOpen) {
      setSearchOpen(false)
      setQuery('')
    } else setSearchOpen(true)
  }
  const accountValue = isSignedIn ? displayName : 'Guest'
  const settingRows = [
    {
      key: 'account',
      label: 'Account',
      value: accountValue,
      Icon: UserRound,
      action: isSignedIn ? () => setLocation('/settings/account') : () => setLocation('/sign-in'),
      testId: 'settings-account',
    },
    {
      key: 'appearance',
      label: 'Appearance',
      value: { system: 'System', light: 'Light', dark: 'Dark' }[theme] || 'System',
      Icon: Sun,
      action: () => setActiveSheet('appearance'),
      testId: 'settings-appearance',
    },
    {
      key: 'privacy',
      label: 'Privacy & service',
      Icon: CircleHelp,
      action: () => setActiveSheet('privacy'),
      testId: 'settings-privacy',
    },
  ]
  const visibleRows = settingRows.filter((row) => `${row.label} ${row.value || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="page settings-page settings-native-page">
    <header className="settings-native-header">
      <button type="button" className="settings-toolbar-button" onClick={goBack} aria-label="Go back" data-testid="settings-back"><ArrowLeft size={19} /></button>
      <h1>Settings</h1>
      <button type="button" className="settings-toolbar-button" onClick={openSearch} aria-label={searchOpen ? 'Close settings search' : 'Search settings'} aria-pressed={searchOpen} data-testid="settings-search-toggle">
        {searchOpen ? <X size={18} /> : <Search size={19} />}
      </button>
    </header>
    {searchOpen && <label className="settings-search">
      <Search size={17} aria-hidden="true" />
      <span className="sr-only">Search settings</span>
      <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { setSearchOpen(false); setQuery('') } }} placeholder="Search settings" data-testid="settings-search-input" />
      {query && <button type="button" onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="Clear search"><X size={16} /></button>}
    </label>}
    <div className="settings-native-groups" aria-label="Settings">
      {[['account'], ['appearance', 'privacy']].map((keys) => {
        const rows = visibleRows.filter((row) => keys.includes(row.key))
        return rows.length > 0 && <div className="settings-native-group" key={keys[0]}>
          {rows.map(({ key, label, value, Icon, action, testId }) => <button key={key} type="button" className="settings-native-row" onClick={action} data-testid={testId}>
            <span className="settings-row-symbol"><Icon size={17} strokeWidth={1.7} /></span>
            <span className="settings-row-title">{label}</span>
            {value && <span className="settings-row-value">{value}</span>}
            <ChevronRight size={18} className="settings-native-chevron" />
          </button>)}
        </div>
      })}
      {!visibleRows.length && <p className="settings-search-empty">No settings found</p>}
    </div>
    <dialog ref={sheetRef} className="settings-native-sheet" aria-labelledby="settings-sheet-title" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }} onClose={() => setActiveSheet(null)}>
      <div className="settings-sheet-grabber" aria-hidden="true" />
      <header className="settings-sheet-header">
        <h2 id="settings-sheet-title">{activeSheet === 'appearance' ? 'Appearance' : 'Privacy & service'}</h2>
        <button type="button" className="settings-sheet-close" onClick={() => sheetRef.current?.close()} aria-label="Close">Done</button>
      </header>
      {activeSheet === 'appearance'
        ? <div className="settings-sheet-group" role="radiogroup" aria-label="Appearance">
            {appearanceOptions.map(([value, label]) => <label className="settings-choice-row" key={value}>
              <input type="radio" name="tally-appearance" value={value} checked={theme === value} onChange={() => setTheme(value)} data-testid={`appearance-${value}`} />
              <span>{label}</span>{theme === value && <Check size={19} aria-hidden="true" />}
            </label>)}
          </div>
        : <div className="settings-privacy-copy">
            {!isSignedIn && <section><h3>Guest kitchen</h3><p>Recipes and lists stay in this browser on this device. Clearing browser data removes them; they are not a cloud backup. AI needs an internet connection and sends your conversation and current draft for processing, not your whole kitchen. Recipe-opening counts for Home recommendations stay on this device.</p></section>}
            {isSignedIn && <section><h3>Account</h3><p>Your cloud recipes and grocery lists are private to your signed-in account. The guest kitchen stays separate on this device.</p></section>}
            <section><h3>Assistant</h3><p>Messages are sent to Tally’s assistant service to prepare replies. Chat requires sign-in.</p></section>
            <section><h3>Your recipes</h3><p>Drafts are saved only after you approve them. Voice and recipe media aren’t available in this version.</p></section>
          </div>}
    </dialog>
  </div>
}

function AccountPage({ user, isSignedIn }) {
  const { signOut } = useClerk()
  const [busy, setBusy] = useState(false)
  if (!isSignedIn) return <div className="page"><SignInPrompt /></div>
  return <div className="page account-page">
    <ScreenTitle eyebrow="Settings" title="Account" detail="Your account details and sign-in." />
    <section className="account-detail-card"><span className="account-avatar large-avatar">{(user?.firstName || user?.primaryEmailAddress?.emailAddress || 'T').slice(0, 1).toUpperCase()}</span><h2>{user?.fullName || 'Your Tally account'}</h2><p>{user?.primaryEmailAddress?.emailAddress}</p></section>
    <div className="account-info"><span>Email address</span><strong>{user?.primaryEmailAddress?.emailAddress || 'Not provided'}</strong></div>
    <div className="account-info"><span>Account status</span><strong className="account-status"><span /> Signed in</strong></div>
    <div className="account-info"><span>Data access</span><strong>Private to your account</strong></div>
    <button type="button" className="button button-secondary button-full signout-button" disabled={busy} onClick={async () => { setBusy(true); await signOut({ redirectUrl: `${basePath || ''}/` }) }}><LogOut size={18} /> {busy ? 'Signing out…' : 'Sign out'}</button>
    <p className="account-footnote">Signing out returns to Tally Home. Your saved records remain linked to your account.</p>
  </div>
}

function NotFound() {
  return <div className="page"><EmptyState icon={<CircleHelp size={22} />} title="This page isn’t here" detail="The kitchen is still right where you left it." action={<Link href="/home" className="button button-primary">Back to Home</Link>} /></div>
}

export default App
