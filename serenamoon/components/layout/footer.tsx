import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background py-20 px-8 transition-colors duration-300">
      <div className="absolute top-0 left-1/2 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"></div>
      
      <div className="relative z-10 mx-auto max-w-7xl text-center">
        <p className="serif mb-8 text-5xl italic tracking-wider text-foreground">
          Serena Moon
        </p>
        
        <div className="mx-auto mb-8 h-px w-12 bg-border"></div>
        
        {/* Caption: Uses muted-foreground for softer contrast */}
        <p className="mx-auto max-w-lg text-[10px] leading-relaxed uppercase tracking-[0.3em] text-muted-foreground">
          The tide rises and falls, but the image remains. All works are digitally signed and monitored.
        </p>
        
        {/* Links: Subtle text that brightens on hover */}
        <div className="mt-12 flex justify-center gap-10 font-light uppercase tracking-[0.4em] text-[10px] text-muted-foreground/80">
          <a href="#" className="transition-colors hover:text-foreground">
            Archive
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Legal
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Connect
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;