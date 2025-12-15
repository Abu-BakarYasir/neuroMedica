"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { explainabilityTrustContent } from "@/lib/landing-content";

export function ExplainabilityTrust() {
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
            {explainabilityTrustContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {explainabilityTrustContent.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {explainabilityTrustContent.features.map((feature, index) => (
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
                    <div className="text-4xl">{feature.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-[#212121]">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#525252] leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Visual preview placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 bg-[#F8F8F8] rounded-[20px] p-8 border border-[#EDEDED]"
        >
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-[#212121]">
              Example: Grad-CAM Visualization
            </h3>
            <p className="text-sm text-[#8D8D8D] max-w-2xl mx-auto">
              Visual explanations highlight which regions of medical images the AI focuses on,
              helping you understand model reasoning and build clinical intuition.
            </p>
            <div className="mt-6 bg-white rounded-[10px] p-8 border border-[#EDEDED] min-h-[200px] flex items-center justify-center">
              <p className="text-sm text-[#8D8D8D] italic">
                [Grad-CAM heatmap visualization preview]
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

