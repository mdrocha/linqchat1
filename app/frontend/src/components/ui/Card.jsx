export default function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e7e9f3",
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
