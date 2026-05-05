import { create } from 'zustand'

export const useGroupStore = create((set) => ({
  currentGroup: null,
  currentGroupRole: null,
  
  setCurrentGroup: (group) => set({ currentGroup: group }),
  setCurrentGroupRole: (role) => set({ currentGroupRole: role }),
  
  clearCurrentGroup: () => set({ currentGroup: null, currentGroupRole: null })
}))
