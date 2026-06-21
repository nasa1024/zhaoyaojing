/* tslint:disable */
/* eslint-disable */

export function analyzeImage(bytes: Uint8Array, file_name?: string | null): any;

export function analyzeMedia(bytes: Uint8Array, file_name?: string | null): any;

export function analyzeVideoFrameRgba(rgba: Uint8Array, width: number, height: number, timestamp_seconds: number): any;

export function initPanicHook(): void;

export function inspectExifXmp(bytes: Uint8Array): any;

export function inspectMp4Metadata(bytes: Uint8Array): any;

export function inspectPngMetadata(bytes: Uint8Array): any;

export function start(): void;

export function supportedImageCapabilities(): any;

export function supportedMediaCapabilities(): any;

export function verifyC2pa(bytes: Uint8Array, mime: string): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly analyzeImage: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly analyzeMedia: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly analyzeVideoFrameRgba: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly inspectExifXmp: (a: number, b: number) => [number, number, number];
    readonly inspectMp4Metadata: (a: number, b: number) => [number, number, number];
    readonly inspectPngMetadata: (a: number, b: number) => [number, number, number];
    readonly supportedImageCapabilities: () => [number, number, number];
    readonly verifyC2pa: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly supportedMediaCapabilities: () => [number, number, number];
    readonly initPanicHook: () => void;
    readonly start: () => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
