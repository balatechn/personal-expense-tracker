export function haptic(ms = 10) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function hapticSuccess() { haptic(15); }
export function hapticError() { if (navigator.vibrate) navigator.vibrate([30, 50, 30]); }
export function hapticTap() { haptic(5); }
