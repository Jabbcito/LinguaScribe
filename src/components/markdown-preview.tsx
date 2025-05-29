"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "react-markdown/lib/react-markdown";

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-md border bg-card h-full overflow-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm] as PluggableList}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
