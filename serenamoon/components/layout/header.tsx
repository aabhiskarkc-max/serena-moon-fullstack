'use client';

import Link from "next/link";
import { Search, User, Bell, Menu, X, LayoutDashboard, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "../toggle-theme";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type HeaderUser = {
  email: string;
  username?: string | null;
  avatar?: string | null;
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("serena_token");
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUser({ email: data.email, username: data.username, avatar: data.avatar });
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("serena_token");
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    fetchProfile();
  }, []);

  const NavLinks = () => (
    <nav className="flex items-center gap-6 mr-2">
      <Link
        href="/feed"
        className={`text-[12px] font-bold uppercase tracking-[0.2em] transition-all hover:text-primary ${
          pathname === '/feed' ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        Feed
      </Link>
      <Link
        href="/ebook"
        className={`text-[12px] font-bold uppercase tracking-[0.2em] transition-all hover:text-indigo-100 ${
          pathname === '/ebook' ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        E-Book
      </Link>
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
      {/* FULL WIDTH WRAPPER */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        
        {/* MAX WIDTH CONTAINER FOR ULTRA LARGE SCREENS */}
        <div className="max-w-[1600px] mx-auto flex h-16 items-center justify-between">
          
          {/* LEFT: Logo */}
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter shrink-0">
            SERENA
            <span className="text-primary font-light underline decoration-2 underline-offset-4">
              MOON
            </span>
          </Link>

          {/* CENTER: Search */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-6 relative items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search stories..."
              className="pl-9 rounded-full bg-muted/30 border-none focus-visible:ring-1 h-9 text-xs"
            />
          </div>

          {/* RIGHT: Nav + Actions */}
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            
            {/* Desktop Nav */}
            <div className="hidden lg:block">
              <NavLinks />
            </div>

            {/* Mobile Search */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="cursor-pointer relative hidden md:inline-flex">
              <Bell className="h-8 w-8" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>

            <ThemeToggle />

            {/* Profile / Login */}
            {isAuthenticated && user ? (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => router.push("/profile")}
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="User"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover border border-primary/20"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                    {user.email.split("@")[0].slice(0, 2).toUpperCase()}
                  </span>
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => router.push("/auth/login")}
              >
                <User className="h-8 w-8" />
              </Button>
            )}

            {/* Subscribe */}
            <Button
              className="cursor-pointer hidden md:inline-flex rounded-full px-5 h-9 font-bold uppercase text-[12px] tracking-widest"
              onClick={scrollToPricing}
            >
              Subscribe
            </Button>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden border-t bg-background px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <Link 
              href="/feed" 
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 border border-border"
            >
              <LayoutDashboard className="h-5 w-5 mb-2 text-primary" />
              <span className="text-[14px] uppercase font-bold tracking-widest">Feed</span>
            </Link>

            <Link 
              href="/ebook" 
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 border border-border"
            >
              <BookOpen className="h-5 w-5 mb-2 text-primary" />
              <span className="text-[14px] uppercase font-bold tracking-widest">E-Book</span>
            </Link>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl py-6"
            onClick={() => {
              router.push("/profile");
              setOpen(false);
            }}
          >
            <User className="h-4 w-4" /> Profile
          </Button>
          
          <Button
            className="w-full rounded-full py-6 uppercase font-bold tracking-[0.2em]"
            onClick={() => {
              scrollToPricing();
              setOpen(false);
            }}
          >
            Subscribe
          </Button>
        </div>
      )}
    </header>
  );
}