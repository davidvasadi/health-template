"use client";
import React from "react";
import { BlogCard } from "../blog-card";

export const RelatedArticles = ({ heading, sub_heading, articles, locale }: { heading: string; sub_heading: string; articles: any[], locale: string }) => {
  return (
    <div className="mt-12 pb-20">
      <h2 className="text-2xl font-bold text-breaker-bay-950 mb-10">
        {heading}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {articles.map((article) => (
          <BlogCard key={article.title} article={article} locale={locale} />
        ))}
      </div>
    </div>
  );
};
