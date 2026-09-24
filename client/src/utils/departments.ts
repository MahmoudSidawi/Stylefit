import type { Department } from '../services/shopApi'
import type { DepartmentSelection } from '../components/ui/DepartmentFilter'

export function matchesDepartment(department: Department | undefined, selected: DepartmentSelection) {
  return selected === 'all' || department === 'unisex' || department === selected
}
