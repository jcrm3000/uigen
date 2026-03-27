"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

function getFilename(path: unknown): string {
  if (typeof path !== "string") return "...";
  return path.split("/").pop() || path || "...";
}

export function getToolMessage(
  toolName: string,
  args: Record<string, unknown>
): string {
  const filename = getFilename(args?.path);

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
        return `Editing ${filename}`;
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
      case "undo_edit":
        return `Undoing edit to ${filename}`;
      default:
        return "Working on file...";
    }
  }

  if (toolName === "file_manager") {
    switch (args?.command) {
      case "rename": {
        const newFilename = getFilename(args?.new_path);
        return `Renaming ${filename} → ${newFilename}`;
      }
      case "delete":
        return `Deleting ${filename}`;
      default:
        return "Managing files...";
    }
  }

  return toolName;
}

export function ToolCallDisplay({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const message = getToolMessage(toolInvocation.toolName, toolInvocation.args);
  const isComplete = toolInvocation.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
