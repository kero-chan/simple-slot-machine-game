/**
 * Tile object structure and helper functions
 */

export function createTile(symbol, isGolden = false) {
  return {
    symbol,
    isGolden,
    isWildcard: symbol === 'wild'
  }
}

export function getTileSymbol(tile) {
  if (!tile) return null
  return typeof tile === 'string' ? tile : tile.symbol
}

export function isTileGolden(tile) {
  if (!tile) return false
  if (typeof tile === 'string') return tile.endsWith('_gold')
  return tile.isGolden
}

export function isTileWildcard(tile) {
  if (!tile) return false
  const symbol = getTileBaseSymbol(tile)
  return symbol === 'wild'
}

export function isBonusTile(tile) {
  if (!tile) return false
  const symbol = getTileBaseSymbol(tile)
  return symbol === 'bonus'
}

export function getTileBaseSymbol(tile) {
  if (!tile) return null

  if (typeof tile === 'string') {
    return tile.endsWith('_gold') ? tile.slice(0, -5) : tile
  }

  return tile.symbol
}

export function tilesMatch(tile1, tile2, allowWildcard = true) {
  const symbol1 = getTileBaseSymbol(tile1)
  const symbol2 = getTileBaseSymbol(tile2)

  if (!symbol1 || !symbol2) return false
  if (symbol1 === symbol2) return true

  if (allowWildcard) {
    const isWild1 = isTileWildcard(tile1)
    const isWild2 = isTileWildcard(tile2)
    return isWild1 || isWild2
  }

  return false
}

export function tileToString(tile) {
  if (!tile) return null
  if (typeof tile === 'string') return tile

  const { symbol, isGolden } = tile
  return isGolden && symbol !== 'wild' ? `${symbol}_gold` : symbol
}

export function stringToTile(str) {
  if (!str) return null
  if (typeof str !== 'string') return str

  const isGolden = str.endsWith('_gold')
  const symbol = isGolden ? str.slice(0, -5) : str

  return createTile(symbol, isGolden)
}

export function convertGridToTiles(stringGrid) {
  return stringGrid.map(column =>
    column.map(cell => stringToTile(cell))
  )
}

export function convertGridToStrings(tileGrid) {
  return tileGrid.map(column =>
    column.map(tile => tileToString(tile))
  )
}
