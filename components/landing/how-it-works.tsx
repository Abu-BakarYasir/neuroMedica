"use client";

import { motion } from "framer-motion";
import { howItWorksContent } from "@/lib/landing-content";
import { Upload, Cpu, Shield, FileText } from "lucide-react";

const icons = [Upload, Cpu, Shield, FileText];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            {howItWorksContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {howItWorksContent.subtitle}
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection lines - hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-neuro-primary via-neuro-primary-light to-neuro-primary opacity-20 transform -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksContent.steps.map((step, index) => {
              const Icon = icons[index];
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-white border border-[#EDEDED] rounded-[20px] p-6 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] h-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Step number badge */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                        {step.step}
                      </div>

                      {/* Icon */}
                      <div className="w-16 h-16 rounded-[10px] bg-[#FEF7F3] flex items-center justify-center">
                        <Icon className="text-neuro-primary" size={32} />
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-[#212121]">
                          {step.title}
                        </h3>
                        <p className="text-sm text-[#525252] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow connector - hidden on mobile */}
                  {index < howItWorksContent.steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 z-10">
                      <div className="w-full h-0.5 bg-neuro-primary" />
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-neuro-primary border-t-4 border-t-transparent border-b-4 border-b-transparent" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

