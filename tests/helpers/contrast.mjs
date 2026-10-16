import assert from 'node:assert/strict'

/** Check actual computed colors, including alpha layers and gradient endpoints.
 * This covers selected UI elements, not a full WCAG accessibility audit.
 */
export async function assertReadable(page, selectors, minimum = 4.5) {
  for (const selector of selectors) {
    const matches = page.locator(selector)
    assert(await matches.count() > 0, `Missing contrast sample: ${selector}`)
    for (const node of await matches.all()) {
      const result = await node.evaluate((element) => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        const rgba = (color) => {
          ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1)
          return [...ctx.getImageData(0, 0, 1, 1).data].map((value, index) => index === 3 ? value / 255 : value)
        }
        const over = (a, b) => [...a.slice(0, 3).map((value, index) => value * a[3] + b[index] * (1 - a[3])), 1]
        const luminance = (color) => color.slice(0, 3).map((value) => {
          value /= 255
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
        }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
        let backgrounds = [rgba(getComputedStyle(document.documentElement).getPropertyValue('--surface-page').trim())]
        const ancestors = []
        for (let parent = element; parent; parent = parent.parentElement) ancestors.unshift(parent)
        for (const parent of ancestors) {
          const style = getComputedStyle(parent)
          backgrounds = backgrounds.map((background) => over(rgba(style.backgroundColor), background))
          const stops = style.backgroundImage.match(/(?:rgba?|oklch|oklab|color)\([^)]*\)/g)
          if (stops) backgrounds = backgrounds.flatMap((background) => stops.map((stop) => over(rgba(stop), background)))
        }
        const foreground = rgba(getComputedStyle(element).color)
        const ratios = backgrounds.map((background) => {
          const a = luminance(over(foreground, background)); const b = luminance(background)
          return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
        })
        return { ratio: Math.min(...ratios), color: getComputedStyle(element).color, text: element.textContent?.trim().slice(0, 50) }
      })
      assert(result.ratio >= minimum, `${selector}: ${result.ratio.toFixed(2)}:1 < ${minimum}:1 (${result.text}, ${result.color})`)
    }
  }
}
