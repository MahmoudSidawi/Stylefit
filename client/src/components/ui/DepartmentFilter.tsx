import type { Department } from '../../services/shopApi'
import './department-filter.css'

export type DepartmentSelection = 'all' | 'men' | 'women'

export function DepartmentFilter({ value, onChange }: { value: DepartmentSelection; onChange: (value: DepartmentSelection) => void }) {
  return <div className="department-filter" role="group" aria-label="Clothing department">
    {(['all', 'men', 'women'] as const).map((department) => <button type="button" key={department} aria-pressed={value === department} onClick={() => onChange(department)}>{department === 'all' ? 'All' : department === 'men' ? 'Men' : 'Women'}</button>)}
  </div>
}

export function DepartmentSelect({ value, onChange }: { value?: Department; onChange: (value: Department) => void }) {
  return <label>Department<select value={value ?? 'unisex'} onChange={(event) => onChange(event.target.value as Department)}>
    <option value="men">Men</option><option value="women">Women</option><option value="unisex">Unisex</option>
  </select></label>
}
