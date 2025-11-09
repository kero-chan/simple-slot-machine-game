export function drawBackdrop(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#1f7a3f')
  grad.addColorStop(0.5, '#2e8f4b')
  grad.addColorStop(1, '#207940')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}