// next/components/practices/single-practice/blocks.tsx

import React from "react";

export function Blocks({ content }: { content: any }) {
  if (!content) return null;

  if (typeof content === "string") {
    return <div className="prose prose-neutral max-w-none">{content}</div>;
  }

  if (Array.isArray(content)) {
    return (
      <div className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-h3:text-lg prose-h2:text-xl">
        {content.map((b: any, i: number) => {
          const children = b?.children ?? [];
          const text =
            children
              .map((c: any) => c?.text)
              .filter(Boolean)
              .join("") ?? "";

          switch (b?.type) {
            case "heading": {
              const level = b?.level ?? 3;
              const Tag = (level === 2 ? "h2" : level === 4 ? "h4" : "h3") as any;
              return <Tag key={i}>{text}</Tag>;
            }
            case "list":
              return (
                <ul key={i}>
                  {children.map((li: any, j: number) => (
                    <li key={j}>
                      {(li?.children ?? [])
                        .map((c: any) => c?.text)
                        .filter(Boolean)
                        .join("")}
                    </li>
                  ))}
                </ul>
              );
            default:
              return <p key={i}>{text}</p>;
          }
        })}
      </div>
    );
  }

  return <div className="prose prose-neutral max-w-none">{String(content)}</div>;
}
