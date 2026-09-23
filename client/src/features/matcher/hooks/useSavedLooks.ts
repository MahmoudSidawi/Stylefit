import { shopApi } from '../../../services/shopApi'
import { useRemote, useAction } from '../../live/hooks'
import type { SavedLook } from '../types'

export function useSavedLooks(accountId: string) {
  const remote = useRemote(shopApi.looks, 'looks:' + accountId, accountId !== 'guest')
  const action = useAction()
  return { looks: remote.data ?? [], loading: remote.loading, busy: action.busy,
    error: action.error || remote.error,
    save: (look: Omit<SavedLook, 'id'>) => action.run(() => shopApi.saveLook(look)),
    remove: (id: string) => action.run(() => shopApi.deleteLook(id)) }
}
