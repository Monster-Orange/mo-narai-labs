// The tool's manifest, from narai-tool.json. A JSON import widens its literals ("none" reads as string), so the SDK's
// typed defineTool can't take it as is (mo-narai-sdk#9): the SDK's own check runs first, and only a
// manifest it passes is asserted to be one.
import { defineTool, manifestProblems, type ToolManifest } from "@narai/sdk";
import json from "../narai-tool.json";

const problems = manifestProblems(json);
if (problems.length > 0) throw new Error(`narai-tool.json: ${problems.join("; ")}`);

export const manifest = defineTool(json as ToolManifest);
