import { describe, it, expect } from "vitest";
import { validateHandle } from "../src/bot-routes.js";

describe("validateHandle", () => {
  it("accepts simple slugs", () => {
    expect(validateHandle("shay")).toBeNull();
    expect(validateHandle("jane-doe")).toBeNull();
    expect(validateHandle("dev2024")).toBeNull();
  });

  it("rejects too short, bad chars, and edge hyphens", () => {
    expect(validateHandle("ab")).not.toBeNull();
    expect(validateHandle("Shay")).not.toBeNull(); // uppercase
    expect(validateHandle("-nope")).not.toBeNull();
    expect(validateHandle("nope-")).not.toBeNull();
    expect(validateHandle("has space")).not.toBeNull();
  });

  it("rejects reserved handles", () => {
    expect(validateHandle("api")).not.toBeNull();
    expect(validateHandle("dashboard")).not.toBeNull();
    expect(validateHandle("login")).not.toBeNull();
  });
});
