import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github.css';

const MarkdownRenderer = ({ children }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeSanitize, {
            tagNames: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 
                      'blockquote', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img', 'table',
                      'thead', 'tbody', 'tr', 'th', 'td', 'input'],
            attributes: {
              '*': ['className', 'align'],
              a: ['href', 'title', 'target', 'rel'],
              img: ['src', 'alt', 'title', 'width', 'height'],
              input: ['type', 'checked', 'disabled'],
              code: ['className']
            }
          }]
        ]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="md-link" />
          ),
          img: ({ node, ...props }) => (
            <img {...props} style={{ maxWidth: '100%', borderRadius: 4 }} alt={props.alt || ''} />
          ),
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto' }}>
              <table {...props} className="md-table" />
            </div>
          )
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;