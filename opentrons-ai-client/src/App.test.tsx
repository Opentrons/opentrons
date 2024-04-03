import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import App from "./App";

describe("App", () => {
  it("should render text and image", () => {
    render(<App />);
    const headerText = screen.getByText("Vite + React");
    expect(headerText).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    const secondText = screen.getByText(
      "Click on the Vite and React logos to learn more",
    );
    expect(secondText).toBeInTheDocument();
  });

  it("when clicking the button, the app will count up", () => {
    render(<App />);
    const beforeCount = screen.getByText("count is 0");
    expect(beforeCount).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    const afterCount = screen.getByText("count is 1");
    expect(afterCount).toBeInTheDocument();
  });
});
