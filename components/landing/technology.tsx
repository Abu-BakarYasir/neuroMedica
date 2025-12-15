"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { technologyContent } from "@/lib/landing-content";
import { Cpu, Database, Activity, FileText, Globe } from "lucide-react";

const icons = [Cpu, Database, Activity, FileText, Globe];

export function Technology() {
  return (
    <section id="technology" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            {technologyContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {technologyContent.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologyContent.technologies.map((tech, index) => {
            const Icon = icons[index] || Cpu;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] h-full rounded-[20px]">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-[10px] bg-[#FEF7F3] flex items-center justify-center flex-shrink-0">
                        <Icon className="text-neuro-primary" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#212121] mb-2">
                          {tech.name}
                        </h3>
                        <p className="text-sm text-[#525252] leading-relaxed">
                          {tech.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Research Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#8D8D8D] max-w-3xl mx-auto leading-relaxed">
            This platform represents ongoing research in explainable AI for medical education.
            All models and architectures are continuously evaluated and improved based on academic
            standards and educational feedback.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

