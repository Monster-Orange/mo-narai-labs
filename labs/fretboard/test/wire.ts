// A launch over a real MessageChannel, wired as a browser wires an iframe (the SDK's own handshake tests do the same):
// the tool's hello reaches the host's window from the frame at the tool's origin; the frame's postMessage reaches the
// tool's window from its parent at Narai's origin, with the port. Every publisher's contract test needs this; the SDK
// doesn't ship it yet (a finding: mo-narai-sdk, a test kit).
import { connect, mountTool, toolOrigin, type ConnectEvent, type HelloEvent, type HostWindow, type MountOptions, type PortLike, type ToolFrame, type ToolManifest, type ToolSession, type ToolWindow } from "@narai/sdk";
import { payloadChecks } from "@narai/sdk/payloads";

export const HOST = "https://michinar.ai";
type Listener<E> = (event: E) => void;

export async function launch(manifest: ToolManifest, options: Omit<MountOptions, "frame" | "window" | "channel">) {
  const origin = toolOrigin(manifest);
  const hostListeners = new Set<Listener<HelloEvent>>();
  const toolListeners = new Set<Listener<ConnectEvent>>();
  const later = <E>(listeners: Set<Listener<E>>, event: E) => queueMicrotask(() => { for (const l of [...listeners]) l(event); });
  const hostWindow: HostWindow = { addEventListener: (_, l) => hostListeners.add(l), removeEventListener: (_, l) => hostListeners.delete(l) };
  const frame: ToolFrame = {
    postMessage: (data, _origin, transfer) => later(toolListeners, { data, origin: HOST, source: hostWindow, ports: transfer as unknown as PortLike[] }),
  };
  const win: ToolWindow = {
    parent: Object.assign(hostWindow, { postMessage: (data: unknown) => later(hostListeners, { data, origin, source: frame }) }),
    addEventListener: (_, l) => toolListeners.add(l),
    removeEventListener: (_, l) => toolListeners.delete(l),
  };
  const ports: { close(): void }[] = [];
  const channel = () => { const c = new MessageChannel(); ports.push(c.port1, c.port2); return c as unknown as { port1: PortLike; port2: Transferable } };
  const toolRefused: unknown[] = [];
  const connected = connect(manifest, { hostOrigins: [HOST], window: win, onRefused: (r) => toolRefused.push(r) });
  const host = mountTool(manifest, { ...options, frame, window: hostWindow, channel, payloads: options.payloads ?? payloadChecks(manifest) });
  const tool: ToolSession = await connected;
  // the tool's parent as the tool's page sees it: what it posts there reaches the host's window, from the frame
  return { tool, host, toolRefused, parent: win.parent, close: () => { for (const p of ports) p.close(); } };
}

export const tick = () => new Promise((r) => setTimeout(r, 10));
