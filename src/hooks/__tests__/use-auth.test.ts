import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();

const {
  mockSignInAction,
  mockSignUpAction,
  mockGetAnonWorkData,
  mockClearAnonWork,
  mockGetProjects,
  mockCreateProject,
} = vi.hoisted(() => ({
  mockSignInAction: vi.fn(),
  mockSignUpAction: vi.fn(),
  mockGetAnonWorkData: vi.fn(),
  mockClearAnonWork: vi.fn(),
  mockGetProjects: vi.fn(),
  mockCreateProject: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: mockSignInAction,
  signUp: mockSignUpAction,
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: mockGetAnonWorkData,
  clearAnonWork: mockClearAnonWork,
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: mockGetProjects,
}));

vi.mock("@/actions/create-project", () => ({
  createProject: mockCreateProject,
}));

import { useAuth } from "@/hooks/use-auth";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" });
});

describe("useAuth", () => {
  test("returns signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toHaveProperty("signIn");
    expect(result.current).toHaveProperty("signUp");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current.isLoading).toBe(false);
  });

  describe("signIn", () => {
    test("calls signInAction with email and password", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "fail" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockSignInAction).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });

    test("returns the auth result", async () => {
      const authResult = { success: true };
      mockSignInAction.mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn(
          "test@example.com",
          "password123"
        );
      });

      expect(returnValue).toEqual(authResult);
    });

    test("returns error result on failed sign in", async () => {
      const authResult = { success: false, error: "Invalid credentials" };
      mockSignInAction.mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn(
          "test@example.com",
          "wrong-pass"
        );
      });

      expect(returnValue).toEqual(authResult);
    });

    test("does not navigate on failed sign in", async () => {
      mockSignInAction.mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "wrong-pass");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to true during sign in and false after", async () => {
      let resolveSignIn: (value: any) => void;
      mockSignInAction.mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn!({ success: false });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("sets isLoading to false even when signInAction throws", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current
          .signIn("test@example.com", "pass")
          .catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("calls signUpAction with email and password", async () => {
      mockSignUpAction.mockResolvedValue({ success: false, error: "fail" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockSignUpAction).toHaveBeenCalledWith(
        "new@example.com",
        "password123"
      );
    });

    test("returns the auth result", async () => {
      const authResult = { success: true };
      mockSignUpAction.mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp(
          "new@example.com",
          "password123"
        );
      });

      expect(returnValue).toEqual(authResult);
    });

    test("returns error result on failed sign up", async () => {
      const authResult = {
        success: false,
        error: "Email already registered",
      };
      mockSignUpAction.mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp(
          "existing@example.com",
          "password123"
        );
      });

      expect(returnValue).toEqual(authResult);
    });

    test("does not navigate on failed sign up", async () => {
      mockSignUpAction.mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("existing@example.com", "password123");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even when signUpAction throws", async () => {
      mockSignUpAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current
          .signUp("new@example.com", "pass")
          .catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post-sign-in routing", () => {
    test("recovers anonymous work and navigates to new project", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "/App.jsx": "code" },
      };
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "recovered-project-id" });
      mockSignInAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/recovered-project-id");
    });

    test("ignores anonymous work with empty messages", async () => {
      mockGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);
      mockSignInAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockClearAnonWork).not.toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
    });

    test("navigates to most recent project when no anon work", async () => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: "project-1" },
        { id: "project-2" },
      ]);
      mockSignInAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    test("creates new project when no anon work and no existing projects", async () => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "brand-new-project" });
      mockSignInAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });

    test("post-sign-in routing works the same for signUp", async () => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "user-project" }]);
      mockSignUpAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/user-project");
    });
  });
});
