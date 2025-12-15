"use client";

import Link from "next/link";
import { footerContent } from "@/lib/landing-content";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#EDEDED] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-lg font-semibold text-[#212121]">Neuro Medica</h3>
            <p className="text-sm text-[#8D8D8D] leading-relaxed">
              Explainable AI for Medical Education
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#212121]">Resources</h4>
            <ul className="space-y-3">
              {footerContent.links.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#8D8D8D] hover:text-neuro-primary transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#212121]">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#8D8D8D] hover:text-neuro-primary transition-colors inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#8D8D8D] hover:text-neuro-primary transition-colors inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#8D8D8D] hover:text-neuro-primary transition-colors inline-block"
                >
                  Ethics & Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4 md:col-span-1">
            <h4 className="text-sm font-semibold text-[#212121]">Important</h4>
            <p className="text-xs text-[#8D8D8D] leading-relaxed">
              {footerContent.disclaimer}
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-[#EDEDED] text-center">
          <p className="text-xs text-[#8D8D8D]">{footerContent.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

