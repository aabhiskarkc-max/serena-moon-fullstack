import { Play, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 px-6 md:px-10 py-4 bg-gradient-to-b from-sky-50 via-background to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      <section className="relative h-[70vh] w-full overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-50 mix-blend-soft-light" />
        <div className="relative flex h-full flex-col justify-end p-8 md:p-16 lg:w-2/3">
          <Badge className="w-fit mb-4 bg-amber-400 text-slate-900 uppercase tracking-[0.3em]">
            Featured Story
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black text-slate-50 uppercase italic tracking-tighter leading-[0.9]">
            The Digital <br /> Renaissance
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-200">
            Exploring the intersection of underground culture, retro-tech, and the future of digital media.
          </p>
          <div className="mt-8 flex gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 font-bold bg-amber-400 text-slate-950 hover:bg-amber-300"
            >
              Read Post
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 bg-white/10 backdrop-blur text-slate-50 border-slate-200/40 hover:bg-white/20"
            >
              <Play className="mr-2 h-4 w-4 fill-current" /> Watch Video
            </Button>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Flame className="text-amber-500 h-6 w-6" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              Latest Feed
            </h2>
          </div>
          <Button
            variant="link"
            className="font-bold uppercase tracking-widest text-xs text-sky-700 dark:text-sky-300"
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
          {/* Large Card */}
          <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card">
            <div className="aspect-square md:aspect-auto h-full bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent p-6 flex flex-col justify-end">
              <span className="text-amber-300 text-xs font-bold uppercase mb-2">
                Culture
              </span>
              <h3 className="text-2xl font-bold text-slate-50 uppercase tracking-tight">
                Cyberpunk Architecture in Tokyo
              </h3>
            </div>
          </div>

          {/* Video Card */}
          <div className="md:col-span-2 relative group overflow-hidden rounded-2xl bg-sky-50/80 dark:bg-zinc-900 border border-slate-200/60 dark:border-slate-800">
             <div className="p-6">
                <PlayCircle className="h-10 w-10 text-sky-600 dark:text-sky-400 mb-4" />
                <h3 className="text-xl font-bold uppercase mb-2">
                  Short Film: Analog Dreams
                </h3>
                <p className="text-sm text-muted-foreground">A 10-minute dive into the revival of cassette culture.</p>
             </div>
          </div>

          {/* Small Posts */}
          <div className="md:col-span-1 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:bg-sky-50 dark:hover:bg-slate-900 transition-colors">
            <h4 className="font-bold leading-tight">10 Must-have Gadgets for Minimalists</h4>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">5 Min Read</span>
          </div>
          <div className="md:col-span-1 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:bg-sky-50 dark:hover:bg-slate-900 transition-colors">
            <h4 className="font-bold leading-tight">The Psychology of Y2K Fashion</h4>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">8 Min Read</span>
          </div>
        </div>
      </section>

    

    </div>
  );
}

function PlayCircle({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
      </svg>
    </div>
  );
}