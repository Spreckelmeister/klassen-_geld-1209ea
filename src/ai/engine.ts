// WebLLM Engine Setup + Lifecycle
// WICHTIG: @mlc-ai/web-llm wird lazy per dynamic import() geladen,
// damit es nicht beim Seitenaufruf die React-Suspense stört.

import { DEFAULT_MODEL_ID } from './models';

// Typ-only import (wird zur Laufzeit nicht geladen)
type MLCEngine = import('@mlc-ai/web-llm').MLCEngine;

let engine: MLCEngine | null = null;
let currentModelId: string | null = null;

export async function initAIEngine(
  modelId: string = DEFAULT_MODEL_ID,
  onProgress?: (progress: number) => void,
): Promise<MLCEngine> {
  // Prüfe WebGPU-Support
  if (!('gpu' in navigator)) {
    throw new Error('WEBGPU_NOT_SUPPORTED');
  }

  // Wenn gleiches Modell schon geladen → zurückgeben
  if (engine && currentModelId === modelId) return engine;

  // Altes Modell entladen
  if (engine) {
    await engine.unload();
    engine = null;
    currentModelId = null;
  }

  // Lazy-load: web-llm wird erst hier geladen, nicht bei Modul-Import
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      onProgress?.(report.progress);
    },
  });

  currentModelId = modelId;
  return engine;
}

export function getEngine(): MLCEngine | null {
  return engine;
}

export function getCurrentModelId(): string | null {
  return currentModelId;
}

export async function switchModel(
  modelId: string,
  onProgress?: (progress: number) => void,
): Promise<MLCEngine> {
  return initAIEngine(modelId, onProgress);
}

export async function disposeEngine(): Promise<void> {
  if (engine) {
    await engine.unload();
    engine = null;
    currentModelId = null;
  }
}

export function isWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}
