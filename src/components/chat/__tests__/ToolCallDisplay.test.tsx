import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay, getToolMessage } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

// --- getToolMessage unit tests ---

test("getToolMessage returns 'Creating' for str_replace_editor create command", () => {
  expect(
    getToolMessage("str_replace_editor", {
      command: "create",
      path: "/components/Card.jsx",
    })
  ).toBe("Creating Card.jsx");
});

test("getToolMessage returns 'Editing' for str_replace_editor str_replace command", () => {
  expect(
    getToolMessage("str_replace_editor", {
      command: "str_replace",
      path: "/App.jsx",
    })
  ).toBe("Editing App.jsx");
});

test("getToolMessage returns 'Editing' for str_replace_editor insert command", () => {
  expect(
    getToolMessage("str_replace_editor", {
      command: "insert",
      path: "/utils/helpers.ts",
    })
  ).toBe("Editing helpers.ts");
});

test("getToolMessage returns 'Reading' for str_replace_editor view command", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "view", path: "/App.jsx" })
  ).toBe("Reading App.jsx");
});

test("getToolMessage returns 'Undoing edit to' for undo_edit command", () => {
  expect(
    getToolMessage("str_replace_editor", {
      command: "undo_edit",
      path: "/App.jsx",
    })
  ).toBe("Undoing edit to App.jsx");
});

test("getToolMessage returns rename message with arrow for file_manager rename", () => {
  expect(
    getToolMessage("file_manager", {
      command: "rename",
      path: "/old.jsx",
      new_path: "/new.jsx",
    })
  ).toBe("Renaming old.jsx → new.jsx");
});

test("getToolMessage returns 'Deleting' for file_manager delete command", () => {
  expect(
    getToolMessage("file_manager", { command: "delete", path: "/temp.jsx" })
  ).toBe("Deleting temp.jsx");
});

test("getToolMessage returns raw tool name for unknown tools", () => {
  expect(getToolMessage("unknown_tool", { command: "foo" })).toBe(
    "unknown_tool"
  );
});

test("getToolMessage returns fallback for str_replace_editor with no command", () => {
  expect(getToolMessage("str_replace_editor", {})).toBe("Working on file...");
});

test("getToolMessage returns fallback for file_manager with no command", () => {
  expect(getToolMessage("file_manager", {})).toBe("Managing files...");
});

test("getToolMessage handles missing path gracefully", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "create" })
  ).toBe("Creating ...");
});

// --- ToolCallDisplay component render tests ---

test("ToolCallDisplay shows green dot for completed tool call", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "File created: /App.jsx",
      }}
    />
  );

  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolCallDisplay shows spinner for in-progress tool call", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Card.jsx" },
        state: "call",
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("ToolCallDisplay shows spinner for partial-call state", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {},
        state: "partial-call",
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(screen.getByText("Working on file...")).toBeDefined();
});
