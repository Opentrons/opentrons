import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Button } from "../index";

describe("Button", () => {
  it("renders with the provided label", () => {
    const label = "Click me!";
    render(<Button label={label} />);
    const buttonElement = screen.getByText(label);
    expect(buttonElement).toBeInTheDocument();
  });
});
