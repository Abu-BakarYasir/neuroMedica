"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NeuroMedicaLogo } from "@/components/neuromedica-logo";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "About", href: "#about" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)]"
          : "bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="transition-opacity hover:opacity-80">
            <NeuroMedicaLogo size={32} textSize="text-xl" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-normal text-[#525252] hover:text-neuro-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm font-normal text-[#525252]">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                className="text-sm font-normal text-white rounded-[16px] h-[40px] px-6 hover:brightness-110 shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)]"
                style={{
                  background:
                    "linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)",
                }}
              >
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#212121]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="md:hidden pb-4 border-t border-[#EDEDED] mt-2 pt-4"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-sm font-normal text-[#525252] hover:text-neuro-primary transition-colors text-left py-1"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#EDEDED]">
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full text-sm font-normal text-[#525252]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button
                    className="w-full text-sm font-normal text-white rounded-[16px] h-[40px] hover:brightness-110 shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)]"
                    style={{
                      background:
                        "linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)",
                    }}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

