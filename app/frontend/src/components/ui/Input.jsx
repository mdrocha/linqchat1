export default function Input(props) {
  return (
    <input
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #d7dae6",
        flex: 1,
      }}
    />
  );
}
