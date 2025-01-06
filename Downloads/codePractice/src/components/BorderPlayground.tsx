import React, { useState } from 'react';
import CodePreview from './CodePreview';
import { Copy } from 'lucide-react';

interface BorderStyles {
  width: string;
  style: string;
  color: string;
  radius: string;
}

const BorderPlayground: React.FC = () => {
  const [borderStyles, setBorderStyles] = useState<BorderStyles>({
    width: '2',
    style: 'solid',
    color: '#3B82F6',
    radius: '4',
  });

  const borderStyleOptions = [
    'solid',
    'dashed',
    'dotted',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ];

  const generateCSS = () => {
    return `border: ${borderStyles.width}px ${borderStyles.style} ${borderStyles.color};
border-radius: ${borderStyles.radius}px;`;
  };

  const generateHTML = () => {
    return '<div class="border-example">Your content here</div>';
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Border Controls</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Border Width</label>
              <input
                type="range"
                min="0"
                max="20"
                value={borderStyles.width}
                onChange={(e) => setBorderStyles({ ...borderStyles, width: e.target.value })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600">{borderStyles.width}px</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Border Style</label>
              <select
                value={borderStyles.style}
                onChange={(e) => setBorderStyles({ ...borderStyles, style: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {borderStyleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Border Color</label>
              <input
                type="color"
                value={borderStyles.color}
                onChange={(e) => setBorderStyles({ ...borderStyles, color: e.target.value })}
                className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Border Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                value={borderStyles.radius}
                onChange={(e) => setBorderStyles({ ...borderStyles, radius: e.target.value })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600">{borderStyles.radius}px</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
          <div className="flex items-center justify-center bg-gray-50 p-8 rounded-lg">
            <div
              className="w-48 h-48 bg-white shadow-sm flex items-center justify-center text-gray-500"
              style={{
                border: `${borderStyles.width}px ${borderStyles.style} ${borderStyles.color}`,
                borderRadius: `${borderStyles.radius}px`,
              }}
            >
              Preview Box
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Generated Code</h2>
        <CodePreview html={generateHTML()} css={generateCSS()} />
      </div>
    </div>
  );
};

export default BorderPlayground;
