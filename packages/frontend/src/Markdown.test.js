import React from "react";
import { render, screen } from "@testing-library/react";
import Markdown from "./Markdown";
test("renderiza títulos, énfasis, listas, código y enlaces Markdown", () => {
  render(
    <Markdown>
      {
        "# Guía\n\n**Importante**\n\n- Una tarea\n\n`codigo`\n\n[Repositorio](https://example.com)"
      }
    </Markdown>,
  );
  expect(screen.getByRole("heading", { name: "Guía" })).toBeInTheDocument();
  expect(screen.getByText("Importante").tagName).toBe("STRONG");
  expect(screen.getByRole("listitem")).toHaveTextContent("Una tarea");
  expect(screen.getByRole("link", { name: "Repositorio" })).toHaveAttribute(
    "href",
    "https://example.com",
  );
});
test("no ejecuta HTML ni permite enlaces activos o imágenes de rastreo", () => {
  const { container } = render(
    <Markdown>
      {
        '<script>alert(1)</script>\n\n<img src="https://example.com/x" alt="prueba" onerror="alert(1)">\n\n[ataque](javascript:alert(1))\n\n![rastreo](https://example.com/pixel)'
      }
    </Markdown>,
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
});
