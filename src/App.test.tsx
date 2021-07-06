import React from "react";
import { render } from "@testing-library/react";
import { App } from "./App";

describe("MAIN::APP", () => {
  it("basic rendering", () => {
    const { getByText } = render(<App />);
    expect(getByText("Romeo Personal Finance Manager")).toBeDefined();
  });
});
