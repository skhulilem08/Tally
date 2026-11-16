import {
  NavArrowLeft as BackGlyph,
  ArrowRight as ForwardGlyph,
  OpenBook,
  Check as CheckGlyph,
  CheckCircle,
  NavArrowRight,
  HelpCircle,
  Clock,
  Cutlery,
  HomeSimpleDoor,
  TaskList,
  RefreshCircle,
  LogOut as LogOutGlyph,
  ChatBubble,
  MoreHoriz,
  Plus as PlusGlyph,
  Search as SearchGlyph,
  SendDiagonal,
  Settings as SettingsGlyph,
  ShoppingBag,
  Sparks,
  SunLight,
  HalfMoon,
  Trash,
  User,
  Xmark,
} from 'iconoir-react'

// All interface icons share Iconoir's outline family. The adapter keeps
// existing component size props consistent with Iconoir's SVG dimensions.
function icon(Glyph) {
  function TallyIcon({ size = 24, strokeWidth = 1.5, ...props }) {
    const decorative = !props['aria-label'] && !props['aria-labelledby']
    return (
      <Glyph
        {...props}
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

export const ArrowLeft = icon(BackGlyph)
export const ArrowRight = icon(ForwardGlyph)
export const BookOpen = icon(OpenBook)
export const Check = icon(CheckGlyph)
export const CheckCircle2 = icon(CheckCircle)
export const ChevronRight = icon(NavArrowRight)
export const CircleHelp = icon(HelpCircle)
export const Clock3 = icon(Clock)
export const CookingPot = icon(Cutlery)
export const House = icon(HomeSimpleDoor)
export const ListChecks = icon(TaskList)
export const LoaderCircle = icon(RefreshCircle)
export const LogOut = icon(LogOutGlyph)
export const MessageCircle = icon(ChatBubble)
export const MoreHorizontal = icon(MoreHoriz)
export const Plus = icon(PlusGlyph)
export const Search = icon(SearchGlyph)
export const Send = icon(SendDiagonal)
export const Settings = icon(SettingsGlyph)
export const ShoppingBasket = icon(ShoppingBag)
export const Sparkles = icon(Sparks)
export const Sun = icon(SunLight)
export const Moon = icon(HalfMoon)
export const Trash2 = icon(Trash)
export const UserRound = icon(User)
export const X = icon(Xmark)
