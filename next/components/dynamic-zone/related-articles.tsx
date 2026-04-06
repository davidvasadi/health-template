"use client";
import React from "react";
import { BlogPostRows } from "../blog-post-rows";

export const RelatedArticles = ({ heading, sub_heading, articles, locale }: { 
  heading: string; 
  sub_heading: string; 
  articles: any[]; 
  locale: string 
}) => {
  return (
    <div className="mt-12 pb-20">
      <h2 className="text-2xl font-bold text-breaker-bay-950 mb-2">
        {heading}
      </h2>
      <BlogPostRows articles={articles} locale={locale} />
    </div>
  );
};