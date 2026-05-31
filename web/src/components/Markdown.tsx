import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders the assistant's markdown answer, styled by the `.prose-chat` rules. */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
