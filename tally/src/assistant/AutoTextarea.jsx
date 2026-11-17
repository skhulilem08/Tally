import { useEffect, useLayoutEffect, useRef } from 'react'

export default function AutoTextarea({ value, rows = 3, onInput, style, ...props }) {
  const field = useRef(null)
  const resize = () => {
    const element = field.current
    if (!element || !element.getClientRects().length) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }
  useLayoutEffect(resize, [value, rows])
  useEffect(() => {
    const element = field.current
    if (!element || !window.ResizeObserver) return
    let previousWidth = element.clientWidth
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === previousWidth) return
      previousWidth = element.clientWidth
      resize()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <textarea {...props} ref={field} value={value} rows={rows}
    style={{ ...style, overflowY: 'hidden', resize: 'none' }}
    onInput={(event) => { resize(); onInput?.(event) }} />
}
