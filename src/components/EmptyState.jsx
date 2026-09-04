export default function EmptyState({ icon = '📭', title = 'Belum ada data', subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-text-secondary font-medium mb-1">{title}</p>
      {subtitle && <p className="text-text-muted text-sm max-w-xs">{subtitle}</p>}
    </div>
  );
}
