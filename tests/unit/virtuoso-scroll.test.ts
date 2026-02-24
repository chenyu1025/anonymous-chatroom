import { isVirtuosoAtBottom } from '@/lib/virtuoso-scroll'

describe('isVirtuosoAtBottom', () => {
  it('returns true for empty list', () => {
    expect(isVirtuosoAtBottom({ endIndex: 0, itemCount: 0 })).toBe(true)
  })

  it('returns true when last item is in view', () => {
    expect(isVirtuosoAtBottom({ endIndex: 9, itemCount: 10 })).toBe(true)
  })

  it('returns false when user is away from bottom', () => {
    expect(isVirtuosoAtBottom({ endIndex: 3, itemCount: 10 })).toBe(false)
  })

  it('supports threshold buffer', () => {
    expect(isVirtuosoAtBottom({ endIndex: 8, itemCount: 10, threshold: 1 })).toBe(true)
    expect(isVirtuosoAtBottom({ endIndex: 7, itemCount: 10, threshold: 1 })).toBe(false)
    expect(isVirtuosoAtBottom({ endIndex: 7, itemCount: 10, threshold: 2 })).toBe(true)
  })
})

