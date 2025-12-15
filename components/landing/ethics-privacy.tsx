"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ethicsPrivacyContent } from "@/lib/landing-content";

export function EthicsPrivacy() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            {ethicsPrivacyContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {ethicsPrivacyContent.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ethicsPrivacyContent.points.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] h-full rounded-[20px]">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{point.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-[#212121]">
                        {point.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#525252] leading-relaxed">
                    {point.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 bg-[#FBF6E4] border border-[#DFAD0C]/20 rounded-[20px] p-6"
        >
          <div className="flex items-start gap-4">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-[#212121] mb-2">
                Important Disclaimer
              </h3>
              <p className="text-sm text-[#525252] leading-relaxed">
                This platform is designed exclusively for educational and research purposes.
                It is not intended for clinical decision-making, patient diagnosis, or treatment
                recommendations. All users must understand that AI outputs are learning tools and
                should not replace professional medical judgment or clinical expertise.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

