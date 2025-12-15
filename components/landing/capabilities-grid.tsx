"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capabilitiesContent } from "@/lib/landing-content";
import {
  Stethoscope,
  Activity,
  BookOpen,
  FileText,
  Search,
  FileCheck,
} from "lucide-react";

const icons = [
  Stethoscope, // Chest X-ray
  Activity, // ECG
  BookOpen, // RAG Q&A
  FileText, // Medical OCR
  Search, // Symptom Explorer
  FileCheck, // Report Generator
];

export function CapabilitiesGrid() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            Core Capabilities
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            Six integrated AI modules designed for medical education and learning
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilitiesContent.map((capability, index) => {
            const Icon = icons[index] || FileText;
            const isReportGenerator = capability.id === "report-generator";
            return (
              <motion.div
                key={capability.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] hover:shadow-xl hover:border-neuro-primary/20 transition-all duration-300 rounded-[20px] group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-neuro-primary/20 group-hover:to-neuro-primary/10 transition-colors">
                        <Icon className="text-neuro-primary" size={24} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold text-[#212121] mb-2">
                          {capability.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[#525252] leading-relaxed">
                      {capability.description}
                    </p>
                    {isReportGenerator && (
                      <div className="bg-[#F8F8F8] rounded-[10px] p-3 border border-[#EDEDED]">
                        <p className="text-xs font-medium text-neuro-primary mb-2">
                          Report Preview:
                        </p>
                        <div className="space-y-1">
                          <div className="h-2 bg-white rounded w-full"></div>
                          <div className="h-2 bg-white rounded w-3/4"></div>
                          <div className="h-2 bg-white rounded w-5/6"></div>
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-[#EDEDED]">
                      <p className="text-xs font-medium text-neuro-primary mb-1">
                        Why it matters for learning:
                      </p>
                      <p className="text-xs text-[#8D8D8D] leading-relaxed">
                        {capability.learningValue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

