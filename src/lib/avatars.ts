export interface AvatarStyle {
  id: string
  label: string
  from: string
  to: string
}

// All gradients are light enough for the dark initial on top (contrast >= 7:1).
export const AVATARS: AvatarStyle[] = [
  { id: 'lime', label: 'Lime', from: '#c8ff4d', to: '#7cf29a' },
  { id: 'coral', label: 'Coral', from: '#ff8a78', to: '#ffb36b' },
  { id: 'sky', label: 'Sky', from: '#6fd3ff', to: '#8ea2ff' },
  { id: 'violet', label: 'Violet', from: '#b79cff', to: '#ff9ce0' },
  { id: 'amber', label: 'Amber', from: '#ffd166', to: '#ff9f6b' },
  { id: 'mint', label: 'Mint', from: '#6ff2c5', to: '#6fd3ff' },
  { id: 'rose', label: 'Rose', from: '#ff9ec4', to: '#ffc48a' },
  { id: 'lilac', label: 'Lilac', from: '#d3b8ff', to: '#9fb6ff' },
]

export const avatarById = (id: string) =>
  AVATARS.find(a => a.id === id) ?? AVATARS[0]
