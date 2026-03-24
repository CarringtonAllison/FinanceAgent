import '@testing-library/jest-dom'

// jsdom doesn't implement canvas — lightweight-charts requires it
HTMLCanvasElement.prototype.getContext = (() => ({
  clearRect: () => {},
  fillRect: () => {},
  beginPath: () => {},
  stroke: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  scale: () => {},
  translate: () => {},
  save: () => {},
  restore: () => {},
  lineTo: () => {},
  moveTo: () => {},
  arc: () => {},
  rect: () => {},
  setTransform: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createPattern: () => {},
  clip: () => {},
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

// jsdom doesn't implement matchMedia — lightweight-charts requires it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
