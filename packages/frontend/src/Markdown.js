import PropTypes from "prop-types";
import React from "react";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
const parser = new MarkdownIt({ html: false, breaks: true, linkify: true });
// No se cargan imágenes externas desde descripciones: evita rastreo de visitantes.
export default function Markdown({ children = "", className = "" }) {
  const html = DOMPurify.sanitize(parser.render(String(children)), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["img", "style", "iframe", "form", "input"],
    FORBID_ATTR: ["style"],
  });
  return (
    <div
      className={"markdown " + className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

Markdown.propTypes = { children: PropTypes.node, className: PropTypes.string };
