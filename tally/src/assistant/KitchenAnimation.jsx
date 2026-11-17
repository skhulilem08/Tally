import { useEffect, useRef } from 'react'

export default function KitchenAnimation() {
  const container = useRef(null)
  useEffect(() => {
    let disposed = false
    let animation
    let timer
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      if (!animation) return
      clearTimeout(timer)
      if (motion.matches) animation.goToAndStop(Math.floor(animation.totalFrames / 3), true)
      else {
        animation.goToAndPlay(0, true)
        // Decorative motion stops automatically, rather than looping forever.
        timer = setTimeout(() => animation.pause(), 4000)
      }
    }
    Promise.all([
      import('lottie-web/build/player/lottie_light'),
      import('./assets/cooking-pot.json'),
    ]).then(([player, data]) => {
      if (disposed || !container.current) return
      animation = player.default.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: structuredClone(data.default),
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', viewBoxSize: '540 500 1080 1420' },
      })
      animation.addEventListener('DOMLoaded', updateMotion)
      motion.addEventListener('change', updateMotion)
    }).catch(() => {
      // This illustration is decorative. Neither action depends on its player.
    })
    return () => {
      disposed = true
      clearTimeout(timer)
      motion.removeEventListener('change', updateMotion)
      animation?.destroy()
    }
  }, [])
  return <div className="manual-kitchen-animation" ref={container} aria-hidden="true" />
}
