// The tool's manifest, from narai-tool.json: the SDK checks it as it loads (a manifest with problems throws).
import { defineTool } from "@narai/sdk";
import json from "../narai-tool.json";

export const manifest = defineTool(json);
