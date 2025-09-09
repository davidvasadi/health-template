"use client";

import React, { useEffect, useMemo, useState } from "react";
import FuzzySearch from "fuzzy-search";
import { motion } from "framer-motion";
import { Article } from "@/types/types";
import { Link } from "next-view-transitions";
import { format } from "date-fns";
import { truncate } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

export const BlogPostRows: React.FC<{ articles: Article[] }> = ({ articles }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Article[]>(articles);
  const searcher = useMemo(() => new FuzzySearch(articles, ["title"], { caseSensitive: false }), [articles]);
  useEffect(() => { setResults(searcher.search(search)); }, [search, searcher]);

  return (
    <section className="w-full py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">More posts</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles…"
          className="text-sm w-full md:w-96 p-2 rounded-lg bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-breaker-bay-500 text-neutral-900 placeholder-neutral-400"
        />
      </div>

      {results.length === 0 ? (
        <p className="text-neutral-500 text-center p-6 rounded-xl bg-white ring-1 ring-neutral-200">
          No results found
        </p>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="divide-y divide-neutral-200 bg-white rounded-2xl ring-1 ring-neutral-200 overflow-hidden"
        >
          {results.map((a, i) => (
            <motion.li
              key={a.slug + i}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: spring } }}
              className="group"
            >
              <Link
                href={`blog/${a.slug}`}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-neutral-900 text-base md:text-lg font-medium hover:text-breaker-bay-700 transition-colors">
                    {a.title}
                  </p>
                  <p className="text-neutral-600 text-sm mt-1 max-w-2xl">{truncate(a.description, 100)}</p>
                  <div className="mt-3 flex items-center gap-2 text-neutral-500 text-xs">
                    <span>{format(new Date(a.publishedAt), "MMMM dd, yyyy")}</span>
                    <span className="h-1 w-1 rounded-full bg-neutral-300" />
                    <span className="flex flex-wrap gap-1">
                      {a.categories?.map((c, idx) => (
                        <span
                          key={c.name + idx}
                          className="rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-[11px]"
                        >
                          {c.name}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
};
