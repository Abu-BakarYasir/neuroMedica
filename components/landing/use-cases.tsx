"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCasesContent } from "@/lib/landing-content";
import { CheckCircle2 } from "lucide-react";

export function UseCases() {
  return (
    <section id="use-cases" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            {useCasesContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {useCasesContent.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCasesContent.cases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] hover:shadow-xl transition-shadow rounded-[20px] h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-[#212121] mb-2">
                    {useCase.title}
                  </CardTitle>
                  <p className="text-sm font-medium text-neuro-primary">
                    {useCase.scenario}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Steps */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-[#212121]">
                      Step-by-Step Process:
                    </h4>
                    <ol className="space-y-2">
                      {useCase.steps.map((step, stepIndex) => (
                        <li
                          key={stepIndex}
                          className="flex items-start gap-3 text-sm text-[#525252]"
                        >
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/10 text-neuro-primary font-semibold text-xs flex items-center justify-center mt-0.5">
                            {stepIndex + 1}
                          </span>
                          <span className="flex-1 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Outcome */}
                  <div className="pt-4 border-t border-[#EDEDED]">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="text-success" size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#212121] mb-1">
                          Learning Outcome:
                        </h4>
                        <p className="text-sm text-[#525252] leading-relaxed">
                          {useCase.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

