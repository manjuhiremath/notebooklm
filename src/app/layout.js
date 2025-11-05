import "./globals.css";


export const metadata = {
  title: "NotebookLM Clone",
  description: "AI-Powered PDF Q&A Assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
