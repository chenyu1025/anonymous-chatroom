export function isVirtuosoAtBottom(params: {
  endIndex: number
  itemCount: number
  threshold?: number
}): boolean {
  const { endIndex, itemCount, threshold = 1 } = params
  if (itemCount <= 0) return true
  const lastIndex = itemCount - 1
  return endIndex >= lastIndex - threshold
}

