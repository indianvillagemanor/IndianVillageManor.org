import { describe, it, expect } from "vitest";

function sanitizeEmail(email: string) {
  // Only allow basic email characters
  return email.replace(/[^a-zA-Z0-9@._+-]/g, "");
}

describe("sanitizeEmail", () => {
  it("should allow valid email characters", () => {
    expect(sanitizeEmail("john.doe@example.com")).toBe("john.doe@example.com");
    expect(sanitizeEmail("user+test@domain.co.uk")).toBe("user+test@domain.co.uk");
    expect(sanitizeEmail("user_name-123@domain.com")).toBe("user_name-123@domain.com");
  });

  it("should remove invalid characters", () => {
    expect(sanitizeEmail("<script>@evil.com")).toBe("script@evil.com");
    expect(sanitizeEmail("user@domain.com ")).toBe("user@domain.com");
    expect(sanitizeEmail("user@domain.com!#$%^&*()")).toBe("user@domain.com");
  });

  it("should handle empty and non-string input", () => {
    expect(sanitizeEmail("")).toBe("");
  });
});
