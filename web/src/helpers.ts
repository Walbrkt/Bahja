import { generateHelpers } from "skybridge/web";

// NOTE: The current server is not using method-chaining registration, so
// tool inference resolves to `never`. Use `any` to unblock usage.
export const { useToolInfo, useCallTool } = generateHelpers<any>();
