import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodePreviewProps {
  html: string;
  css: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ html, css }) => {
  const [copiedHTML, setCopiedHTML] = useState(false);
  const [copiedCSS, setCopiedCSS] = useState(false);

  const copyToClipboard = async (text: string, type: 'html' | 'css') => {
    await navigator.clipboard.writeText(text);
    if (type === 'html') {
      setCopiedHTML(true);
      setTimeout(() => setCopiedHTML(false), 2000);
    } else {
      setCopiedCSS(true);
      setTimeout(() => setCopiedCSS(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">HTML</h3>
          <button
            onClick={() => copyToClipboard(html, 'html')}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
          >
            {copiedHTML ? (
              <Check className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copiedHTML ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{html}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">CSS</h3>
          <button
            onClick={() => copyToClipboard(css, 'css')}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
          >
            {copiedCSS ? (
              <Check className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copiedCSS ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{css}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;