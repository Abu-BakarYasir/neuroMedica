"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { finalCtaContent } from "@/lib/landing-content";
import { Users, CheckCircle2 } from "lucide-react";

export function FinalCta() {
  const scrollToFeatures = () => {
    const element = document.querySelector("#features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-neuro-primary/5 to-[#F8F8F8]">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121]">
              {finalCtaContent.title}
            </h2>
            <p className="text-lg text-[#525252] max-w-2xl mx-auto">
              {finalCtaContent.subtitle}
            </p>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-[#525252]">
            <div className="flex items-center gap-2">
              <Users className="text-neuro-primary" size={18} />
              <span>Join 500+ medical students</span>
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
              <span className="ml-1">4.8/5</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/sign-up">
              <Button
                className="text-sm font-normal text-white rounded-[16px] h-[48px] px-8 hover:brightness-110 shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)]"
                style={{
                  background:
                    "linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)",
                }}
              >
                {finalCtaContent.primaryCta}
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={scrollToFeatures}
              className="text-sm font-normal text-[#212121] rounded-[16px] h-[48px] px-8 border border-[#EDEDED] hover:bg-[#F8F8F8]"
            >
              {finalCtaContent.secondaryCta}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-4">
            <CheckCircle2 className="text-success" size={16} />
            <p className="text-xs text-[#8D8D8D]">
              {finalCtaContent.disclaimer}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

