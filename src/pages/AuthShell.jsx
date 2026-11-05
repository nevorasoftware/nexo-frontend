export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rosa-100 via-rosa-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rosa-200 text-2xl font-bold text-rosa-700 shadow-soft">
            N
          </div>
          <h1 className="text-3xl font-bold text-rosa-700">Nexo</h1>
          <p className="mt-1 text-sm text-ink-muted">Gestión simple y bonita para tu salón de belleza</p>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mb-5 mt-1 text-sm text-ink-muted">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
