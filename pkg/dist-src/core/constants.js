export const FILENAME_MAX_LENGTH = 256;
export const CURRENT_VERSION = 1;
export const IV_BYTE_LENGTH = 16;
export const TAG_BYTE_LENGTH = 16;
export const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;
export const DEFAULT_BLOCK_SIZE = 64 * 1024;
export const BLOCK_OVERHEAD = TAG_BYTE_LENGTH + IV_BYTE_LENGTH;