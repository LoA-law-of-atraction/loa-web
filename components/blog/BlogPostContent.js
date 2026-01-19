"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export default function BlogPostContent({ content }) {
  return (
    <div
      className="prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-10
                    prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8
                    prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                    prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-em:text-gray-700
                    prose-code:text-purple-700 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg
                    prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:text-gray-700
                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-gray-700
                    prose-li:mb-2
                    prose-img:rounded-lg prose-img:my-8
                    prose-hr:border-gray-200 prose-hr:my-10
                    prose-table:border-collapse prose-table:w-full
                    prose-th:bg-gray-50 prose-th:border prose-th:border-gray-200 prose-th:p-3 prose-th:text-left prose-th:text-gray-900 prose-th:font-semibold
                    prose-td:border prose-td:border-gray-200 prose-td:p-3 prose-td:text-gray-700"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          img: ({ node, ...props }) => (
            <img {...props} loading="lazy" className="w-full h-auto" />
          ),
          a: ({ node, ...props }) => {
            const isExternal = props.href?.startsWith("http");
            return (
              <a
                {...props}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
