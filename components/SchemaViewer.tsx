import React from 'react';

interface SchemaViewerProps {
  code: string;
  language?: 'prisma' | 'typescript';
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ code, language = 'prisma' }) => {
  const highlightedCode = language === 'prisma' ? highlightPrisma(code) : highlightTS(code);

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <pre className="p-4 font-mono text-sm leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 5px;
          border: 2px solid #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

function highlightPrisma(code: string): string {
  let html = escapeHtml(code);
  html = html.replace(/(\/\/.*)/g, '<span style="color: #6A9955;">$1</span>');
  
  const keywords = ['model', 'enum', 'generator', 'datasource'];
  keywords.forEach(keyword => {
    html = html.replace(new RegExp(`\\b(${keyword})\\b`, 'g'), '<span style="color: #569CD6; font-weight: bold;">$1</span>');
  });

  const types = ['String', 'Int', 'Boolean', 'DateTime', 'Json'];
  types.forEach(type => {
    html = html.replace(new RegExp(`\\b(${type})\\b`, 'g'), '<span style="color: #4EC9B0;">$1</span>');
  });

  html = html.replace(/(@\w+)/g, '<span style="color: #C586C0;">$1</span>');
  html = html.replace(/\b(now|cuid|uuid)\(\)/g, '<span style="color: #DCDCAA;">$1()</span>');
  html = html.replace(/(".*?")/g, '<span style="color: #CE9178;">$1</span>');
  html = html.replace(/\b(\d+)\b/g, '<span style="color: #B5CEA8;">$1</span>');

  return html;
}

function highlightTS(code: string): string {
  let html = escapeHtml(code);
  
  // Comments
  html = html.replace(/(\/\/.*)/g, '<span style="color: #6A9955;">$1</span>');

  // Keywords
  const keywords = ['import', 'from', 'const', 'let', 'var', 'async', 'function', 'await', 'new', 'if', 'else', 'return', 'try', 'catch', 'for', 'true', 'false'];
  keywords.forEach(keyword => {
    html = html.replace(new RegExp(`\\b(${keyword})\\b`, 'g'), '<span style="color: #C586C0;">$1</span>');
  });

  // Types / Classes
  const types = ['PrismaClient', 'Role', 'User', 'UnitPendidikan', 'NavMenu'];
  types.forEach(type => {
    html = html.replace(new RegExp(`\\b(${type})\\b`, 'g'), '<span style="color: #4EC9B0;">$1</span>');
  });

  // Functions/Methods
  html = html.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span style="color: #DCDCAA;">$1</span>');

  // Strings
  html = html.replace(/('.*?')|(".*?")/g, '<span style="color: #CE9178;">$&</span>');
  
  // Numbers
  html = html.replace(/\b(\d+)\b/g, '<span style="color: #B5CEA8;">$1</span>');

  return html;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}