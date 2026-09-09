'use client';

import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { cls } from '@/lib/css';
import { Spinner } from './Spinner';
import styles from './button.module.css';

/**
 * The component state matrix (STANDARDS §3), implemented rather than described.
 *
 * Three of these states are where most button implementations quietly fail:
 *
 * — **Disabled** uses `aria-disabled`, not the `disabled` attribute. A disabled
 *   attribute removes the control from the tab order, so a keyboard user cannot
 *   reach it, cannot read its tooltip, and never learns why they are blocked.
 *   The click is suppressed in the handler instead.
 * — **Loading** locks the button's width to the label's measured width before
 *   swapping in the spinner. Without that measurement the button collapses and
 *   the layout jumps, which is a CLS bug the state matrix exists to prevent.
 * — **Pressed** fires on `pointerdown` for perceived speed, while activation
 *   still happens on click, so keyboard and mouse stay consistent.
 */

export type ButtonVariant = 'primary' | 'ghost' | 'quiet';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'disabled'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Kept focusable and announced; pair it with `disabledReason`. */
  readonly isDisabled?: boolean;
  /** Why the control is unavailable — shown as a tooltip and read by AT. */
  readonly disabledReason?: string;
  readonly isLoading?: boolean;
  /** Announced while loading; the visible label is retained for screen readers. */
  readonly loadingLabel?: string;
  readonly isSelected?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isDisabled = false,
    disabledReason,
    isLoading = false,
    loadingLabel = 'Working…',
    isSelected,
    className,
    children,
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const label = useRef<HTMLSpanElement>(null);
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);

  useLayoutEffect(() => {
    if (isLoading) return;
    // Measure while the label is on screen, so the width is ready before it isn't.
    const width = label.current?.getBoundingClientRect().width;
    if (width) setLockedWidth(width);
  }, [isLoading, children]);

  const inert = isDisabled || isLoading;

  return (
    <button
      {...rest}
      ref={ref}
      type={rest.type ?? 'button'}
      className={cls(styles.button, styles[variant], styles[size], pressed && styles.pressed, className)}
      aria-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      aria-pressed={isSelected}
      title={isDisabled ? disabledReason : rest.title}
      onPointerDown={(event) => {
        if (!inert) setPressed(true);
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setPressed(false);
        onPointerUp?.(event);
      }}
      onPointerLeave={(event) => {
        setPressed(false);
        onPointerLeave?.(event);
      }}
      onClick={(event) => {
        if (inert) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      <span
        ref={label}
        className={cls(styles.label, isLoading && styles.hidden)}
        style={isLoading && lockedWidth !== null ? { width: lockedWidth } : undefined}
      >
        {children}
      </span>
      {isLoading ? (
        <span className={styles.loader} style={lockedWidth !== null ? { width: lockedWidth } : undefined}>
          <Spinner label={loadingLabel} />
        </span>
      ) : null}
    </button>
  );
});
