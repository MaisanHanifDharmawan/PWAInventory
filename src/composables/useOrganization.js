import { storeToRefs } from 'pinia'
import { useProfileStore } from '../stores/profile.store'

export function useOrganization() {
  const profileStore = useProfileStore()

  // storeToRefs exposes both state fields and getters as reactive refs
  const {
    profile,
    role,            // state field
    organizationId,  // getter
    organization,    // getter (legacy shape)
    organizationName, // getter
    inviteCode,      // getter
    isOwner,         // getter
    isManager,       // getter
    isStaff,         // getter
    hasOrganization  // getter
  } = storeToRefs(profileStore)

  const canManageInventory = () => {
    return ['owner', 'manager', 'staff'].includes(role.value)
  }

  const canManageProduction = () => {
    return ['owner', 'manager'].includes(role.value)
  }

  const canManageSettings = () => {
    return role.value === 'owner'
  }

  const requireOrganization = () => {
    if (!organizationId.value) {
      throw new Error('Organization tidak ditemukan')
    }
    return organizationId.value
  }

  return {
    profile,
    role,
    organizationId,
    organization,
    organizationName,
    inviteCode,
    isOwner,
    isManager,
    isStaff,
    hasOrganization,
    canManageInventory,
    canManageProduction,
    canManageSettings,
    requireOrganization
  }
}
