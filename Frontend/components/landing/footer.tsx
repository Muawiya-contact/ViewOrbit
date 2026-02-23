export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 md:flex-row">
        <p>© {new Date().getFullYear()} ViewOrbit. All rights reserved.</p>
        <p>Enterprise-ready audience engagement infrastructure.</p>
      </div>
    </footer>
  );
}
