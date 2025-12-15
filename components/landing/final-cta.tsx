"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { finalCtaContent } from "@/lib/landing-content";

export function FinalCta() {
  const scrollToFeatures = () => {
    const element = document.querySelector("#features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[#F8F8F8]">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121]">
            {finalCtaContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {finalCtaContent.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/sign-up">
              <Button
                className="text-sm font-normal text-white rounded-[16px] h-[40px] px-8 hover:brightness-110 shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)]"
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
              className="text-sm font-normal text-[#212121] rounded-[16px] h-[40px] px-8 border border-[#EDEDED] hover:bg-[#F8F8F8]"
            >
              {finalCtaContent.secondaryCta}
            </Button>
          </div>

          <p className="text-xs text-[#8D8D8D] pt-2">
            {finalCtaContent.disclaimer}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

