"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { heroContent } from "@/lib/landing-content";
import { ArrowDown } from "lucide-react";

export function HeroSection() {
  const scrollToFeatures = () => {
    const element = document.querySelector("#features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#212121] leading-tight">
            {heroContent.headline}
          </h1>

          <p className="text-lg sm:text-xl text-[#525252] max-w-3xl mx-auto leading-relaxed">
            {heroContent.subheadline}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#DFAD0C] bg-[#FBF6E4] px-4 py-2 rounded-[10px] inline-flex">
            <span>{heroContent.disclaimer}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/sign-up">
            <Button
              className="text-sm font-normal text-white rounded-[16px] h-[40px] px-8 hover:brightness-110 shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)]"
              style={{
                background:
                  "linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)",
              }}
            >
              {heroContent.primaryCta}
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={scrollToFeatures}
            className="text-sm font-normal text-[#212121] rounded-[16px] h-[40px] px-8 border border-[#EDEDED] hover:bg-[#F8F8F8]"
          >
            {heroContent.secondaryCta}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-8"
        >
          <button
            onClick={scrollToFeatures}
            className="flex flex-col items-center gap-2 text-[#8D8D8D] hover:text-neuro-primary transition-colors"
            aria-label="Scroll to features"
          >
            <span className="text-xs font-normal">Explore Features</span>
            <ArrowDown className="animate-bounce" size={20} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

