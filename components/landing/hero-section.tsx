"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { heroContent } from "@/lib/landing-content";
import { Users } from "lucide-react";

export function HeroSection() {
  const scrollToFeatures = () => {
    const element = document.querySelector("#features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)",
          }}
        />
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255, 168, 200, 0.3), transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(245, 137, 71, 0.3), transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(255, 168, 200, 0.3), transparent 50%)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#212121] leading-tight">
                {heroContent.headline}
              </h1>

              <p className="text-lg sm:text-xl text-[#525252] leading-relaxed">
                {heroContent.subheadline}
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-[#525252]">
                  <Users className="text-neuro-primary" size={18} />
                  <span className="font-medium">Trusted by 500+ medical students</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-[#DFAD0C] fill-[#DFAD0C]"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-[#525252]">4.8/5 rating</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
            >
              <Link href="/auth/sign-up">
                <Button
                  className="text-sm font-normal text-white rounded-[16px] h-[48px] px-8 hover:brightness-110 shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)]"
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
                className="text-sm font-normal text-[#212121] rounded-[16px] h-[48px] px-8 border border-[#EDEDED] hover:bg-[#F8F8F8]"
              >
                {heroContent.secondaryCta}
              </Button>
            </motion.div>
          </div>

          {/* Right Column - Visual Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5 rounded-[24px] p-8 border border-[#EDEDED] shadow-lg">
                <div className="bg-white rounded-[16px] p-6 space-y-4">
                  <div className="h-4 bg-[#F8F8F8] rounded w-3/4"></div>
                  <div className="h-4 bg-[#F8F8F8] rounded w-full"></div>
                  <div className="h-4 bg-[#F8F8F8] rounded w-5/6"></div>
                  <div className="h-32 bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/5 rounded-[10px] mt-4"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

