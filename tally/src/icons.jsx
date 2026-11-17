import { HugeiconsIcon } from '@hugeicons/react'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import ArrowRight02Icon from '@hugeicons/core-free-icons/ArrowRight02Icon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import BookOpen01Icon from '@hugeicons/core-free-icons/BookOpen01Icon'
import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon'
import CheckmarkCircle02Icon from '@hugeicons/core-free-icons/CheckmarkCircle02Icon'
import HelpCircleIcon from '@hugeicons/core-free-icons/HelpCircleIcon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import KitchenUtensilsIcon from '@hugeicons/core-free-icons/KitchenUtensilsIcon'
import Home01Icon from '@hugeicons/core-free-icons/Home01Icon'
import Task01Icon from '@hugeicons/core-free-icons/Task01Icon'
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon'
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon'
import BubbleChatIcon from '@hugeicons/core-free-icons/BubbleChatIcon'
import MoreHorizontalIcon from '@hugeicons/core-free-icons/MoreHorizontalIcon'
import Add01Icon from '@hugeicons/core-free-icons/Add01Icon'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import SentIcon from '@hugeicons/core-free-icons/SentIcon'
import Settings02Icon from '@hugeicons/core-free-icons/Settings02Icon'
import ShoppingBasket01Icon from '@hugeicons/core-free-icons/ShoppingBasket01Icon'
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import Sun01Icon from '@hugeicons/core-free-icons/Sun01Icon'
import Moon02Icon from '@hugeicons/core-free-icons/Moon02Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import UserCircleIcon from '@hugeicons/core-free-icons/UserCircleIcon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import FingerAccessIcon from '@hugeicons/core-free-icons/FingerAccessIcon'

// One shared Hugeicons Stroke Rounded family for every interface glyph.
// Semantic aliases keep the screens independent of a library's naming scheme.
function icon(Glyph) {
  function TallyIcon({ size = 24, strokeWidth = 1.5, ...props }) {
    const decorative = !props['aria-label'] && !props['aria-labelledby']
    return (
      <HugeiconsIcon
        {...props}
        icon={Glyph}
        size={size}
        width={props.width ?? size}
        height={props.height ?? size}
        strokeWidth={strokeWidth}
        color={props.color ?? 'currentColor'}
        aria-hidden={props['aria-hidden'] ?? decorative}
        focusable="false"
      />
    )
  }
  return TallyIcon
}

export const ArrowLeft = icon(ArrowLeft01Icon)
export const ArrowRight = icon(ArrowRight02Icon)
export const BookOpen = icon(BookOpen01Icon)
export const Check = icon(Tick02Icon)
export const CheckCircle2 = icon(CheckmarkCircle02Icon)
export const ChevronRight = icon(ArrowRight01Icon)
export const CircleHelp = icon(HelpCircleIcon)
export const Clock3 = icon(Clock01Icon)
export const CookingPot = icon(KitchenUtensilsIcon)
export const House = icon(Home01Icon)
export const ListChecks = icon(Task01Icon)
export const LoaderCircle = icon(RefreshIcon)
export const LogOut = icon(Logout01Icon)
export const MessageCircle = icon(BubbleChatIcon)
export const MoreHorizontal = icon(MoreHorizontalIcon)
export const Plus = icon(Add01Icon)
export const Search = icon(Search01Icon)
export const Send = icon(SentIcon)
export const Settings = icon(Settings02Icon)
export const ShoppingBasket = icon(ShoppingBasket01Icon)
export const Sparkles = icon(SparklesIcon)
export const Sun = icon(Sun01Icon)
export const Moon = icon(Moon02Icon)
export const Trash2 = icon(Delete02Icon)
export const UserRound = icon(UserCircleIcon)
export const X = icon(Cancel01Icon)
export const FingerAccess = icon(FingerAccessIcon)
