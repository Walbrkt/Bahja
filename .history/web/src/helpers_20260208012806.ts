import { generateHelpers } from "skybridge/web";
import type { AppType } from "../../server/src/server";

export const { useToolInfo, useCallTool, useSendMessage } = generateHelpers<AppType>();
