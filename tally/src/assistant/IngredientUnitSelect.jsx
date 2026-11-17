import { ChevronRight } from '../icons.jsx'

const units = ['g', 'kg', 'mg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'clove', 'pinch', 'bunch', 'can', 'pack', 'slice']

export default function IngredientUnitSelect({ value = '', ...props }) {
  // Existing drafts may contain a free-text unit. Keep that exact value
  // available instead of silently converting or clearing it.
  const customUnit = value && !units.includes(value)
  return (
    <span className="manual-unit-picker">
      <select {...props} value={value}>
        <option value="" disabled>Unit</option>
        {customUnit && <option value={value}>{value}</option>}
        {units.map((unit) => <option value={unit} key={unit}>{unit}</option>)}
      </select>
      <ChevronRight size={14} className="manual-unit-chevron" aria-hidden="true" />
    </span>
  )
}
