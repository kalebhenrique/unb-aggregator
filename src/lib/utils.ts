import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    console.warn('Blocked unsafe external URL scheme:', url);
    return;
  }
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_external_url', { url });
      return;
    } catch (e) {
      console.warn('Erro ao abrir link externo via Tauri, usando fallback:', e);
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

