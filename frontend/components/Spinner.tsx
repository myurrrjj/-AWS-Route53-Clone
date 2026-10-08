export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-aws-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-aws-border border-t-aws-blue" />
      <span>{label}</span>
    </div>
  );
}
