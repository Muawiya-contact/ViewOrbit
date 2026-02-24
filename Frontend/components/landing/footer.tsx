import Link from "next/link";
import { Instagram, Music2, Youtube } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0B1A33]">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-12 lg:grid-cols-3 lg:px-20">
        <div className="space-y-3 text-slate-300">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
              VO
            </div>
            <span className="text-lg font-semibold text-white">ViewOrbit</span>
          </div>
          <p className="text-sm">Building trusted engagement and payout workflows for creators and viewers worldwide.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
          <Link href="#" className="hover:text-white">About</Link>
          <Link href="#" className="hover:text-white">Terms</Link>
          <Link href="#" className="hover:text-white">Privacy</Link>
          <Link href="#" className="hover:text-white">Contact</Link>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <Instagram className="h-5 w-5" />
          <Music2 className="h-5 w-5" />
          <Youtube className="h-5 w-5" />
        </div>
      </div>
    </footer>
  );
}
