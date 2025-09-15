"use client";

import React from "react";

/** Egyszerű, “best-effort” renderer Strapi Rich Text (Blocks) + sima HTML stringhez */
type Node = any;

function textOf(node: Node): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) return node.children.map(textOf).join("");
  return "";
}

export function BlocksRenderer({ content }: { content: any }) {
  if (!content) return null;

  // Ha WYSIWYG-ből HTML stringet kapsz
  if (typeof content === "string") {
    return (
      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Strapi “Rich text (Blocks)”
  if (!Array.isArray(content)) return null;

  return (
    <article className="prose prose-neutral max-w-none">
      {content.map((block: any, i: number) => {
        switch (block.type) {
          case "paragraph":
            return <p key={i} dangerouslySetInnerHTML={{ __html: textOf(block) }} />;
          case "heading": {
            const txt = textOf(block);
            if (block.level === 1) return <h1 key={i}>{txt}</h1>;
            if (block.level === 2) return <h2 key={i}>{txt}</h2>;
            if (block.level === 3) return <h3 key={i}>{txt}</h3>;
            if (block.level === 4) return <h4 key={i}>{txt}</h4>;
            if (block.level === 5) return <h5 key={i}>{txt}</h5>;
            return <h6 key={i}>{txt}</h6>;
          }
          case "quote":
            return <blockquote key={i}>{textOf(block)}</blockquote>;
          case "list": {
            const Tag = block.format === "ordered" ? "ol" : ("ul" as const);
            return (
              <Tag key={i}>
                {(block.children || []).map((li: any, j: number) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: textOf(li) }} />
                ))}
              </Tag>
            );
          }
          case "image": {
            const url =
              block?.image?.url ||
              block?.image?.formats?.large?.url ||
              block?.image?.formats?.medium?.url;
            const alt = block?.image?.alternativeText || "";
            if (!url) return null;
            // eslint-disable-next-line @next/next/no-img-element
            return <img key={i} src={url} alt={alt} />;
          }
          case "link":
            return (
              <a key={i} href={block.url} target="_blank" rel="noopener noreferrer">
                {textOf(block)}
              </a>
            );
          case "code":
            return (
              <pre key={i}>
                <code>{block.code || textOf(block)}</code>
              </pre>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}
