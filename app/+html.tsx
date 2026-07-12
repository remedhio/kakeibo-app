import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f7f7f4" />
        <ScrollViewStyleReset />
        <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyle = `
  html, body, #root {
    height: 100%;
    background-color: #f7f7f4;
    color: #26251e;
    font-family: Inter, system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  * {
    box-sizing: border-box;
  }
  input, button, textarea, select {
    font-family: inherit;
    font-size: 16px;
  }
  input[type="date"],
  input[type="month"] {
    min-height: 44px;
    max-width: 100%;
  }
  @media (max-width: 640px) {
    body {
      overscroll-behavior-y: none;
    }
  }
`;
