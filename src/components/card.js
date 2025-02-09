export function Card({ children, className = "" }) {
  return <div className={`border p-4 shadow-md ${className}`}>{children}</div>;
}

export function CardContent({ children }) {
  return <div className="p-2">{children}</div>;
}
