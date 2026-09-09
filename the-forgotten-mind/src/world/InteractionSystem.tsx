'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { actOnFocus, clearPin, cycleFocus, focused, updateFocus } from './systems/interact';
import { interactable } from './systems/player';

/**
 * The one place the world decides what `E` means, and the one place the prompt
 * is written.
 *
 * It runs inside the Canvas so it can update every frame, but it never calls
 * `setState`: the prompt is a DOM node written by `textContent`, and the focus
 * change that triggers it happens a few times a minute rather than sixty times
 * a second.
 *
 * The prompt is also an `aria-live` region. That is what makes `[` and `]`
 * usable by a screen reader: cycling announces the name of the thing now
 * focused, which is the whole mechanism behind "keyboard-completable".
 */
export function InteractionSystem() {
  const prompt = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = document.createElement('div');
    node.className = 'tfm-prompt';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.hidden = true;
    document.body.append(node);
    prompt.current = node;
    return () => {
      node.remove();
      prompt.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      if (event.code === 'BracketLeft' || event.code === 'BracketRight') {
        event.preventDefault();
        cycleFocus(event.code === 'BracketRight' ? 1 : -1);
        write();
        return;
      }

      if (event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') {
        if (!focused.current) return;
        event.preventDefault();
        actOnFocus();
        write();
      }
    };

    const write = () => {
      const node = prompt.current;
      if (!node) return;
      const target = focused.current;
      node.hidden = target === null;
      node.textContent = target === null ? '' : `◈  ${target.title}   —   press E`;
      // Kept in sync for the movement controller, which suppresses E-to-turn.
      interactable.current = target ? { id: target.id, title: target.title } : null;
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearPin();
      interactable.current = null;
    };
  }, []);

  useFrame(() => {
    if (!updateFocus()) return;
    const node = prompt.current;
    const target = focused.current;
    if (node) {
      node.hidden = target === null;
      node.textContent = target === null ? '' : `◈  ${target.title}   —   press E`;
    }
    interactable.current = target ? { id: target.id, title: target.title } : null;
  });

  return null;
}
