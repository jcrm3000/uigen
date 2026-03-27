import { test, expect, vi, beforeEach } from "vitest";

const {
  mockSet,
  mockSign,
  mockSetProtectedHeader,
  mockSetExpirationTime,
  mockSetIssuedAt,
} = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockSign: vi.fn().mockResolvedValue("mock-jwt-token"),
  mockSetProtectedHeader: vi.fn().mockReturnThis(),
  mockSetExpirationTime: vi.fn().mockReturnThis(),
  mockSetIssuedAt: vi.fn().mockReturnThis(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockSet,
  }),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader,
    setExpirationTime: mockSetExpirationTime,
    setIssuedAt: mockSetIssuedAt,
    sign: mockSign,
  })),
  jwtVerify: vi.fn(),
}));

import { createSession } from "../auth";
import { SignJWT } from "jose";

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession creates a JWT with correct payload", async () => {
  await createSession("user-123", "test@example.com");

  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: "user-123",
      email: "test@example.com",
      expiresAt: expect.any(Date),
    })
  );
});

test("createSession sets HS256 algorithm", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
});

test("createSession sets 7 day expiration", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
});

test("createSession sets issued at timestamp", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSetIssuedAt).toHaveBeenCalled();
});

test("createSession sets httpOnly cookie with the token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSet).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    })
  );
});

test("createSession sets cookie expiration 7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const cookieOptions = mockSet.mock.calls[0][2];
  const expiresMs = cookieOptions.expires.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs);
});

test("createSession sets secure flag based on NODE_ENV", async () => {
  await createSession("user-123", "test@example.com");

  const cookieOptions = mockSet.mock.calls[0][2];
  expect(cookieOptions.secure).toBe(process.env.NODE_ENV === "production");
});
