"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { reportPreviewContent } from "@/lib/landing-content";
import { FileText, Edit, Link2, Download, CheckCircle2 } from "lucide-react";

export function ReportPreview() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            {reportPreviewContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {reportPreviewContent.subtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-[#212121] mb-6">
              Key Features
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {reportPreviewContent.features.map((feature, index) => {
                const icons = [Edit, Link2, FileText, CheckCircle2, Download, FileText];
                const Icon = icons[index] || FileText;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-[10px] border border-[#EDEDED]"
                  >
                    <Icon className="text-neuro-primary mt-0.5 flex-shrink-0" size={20} />
                    <span className="text-sm text-[#525252]">{feature}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Report Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border border-[#EDEDED] bg-white shadow-lg rounded-[20px] overflow-hidden">
              <div className="bg-[#F8F8F8] px-6 py-3 border-b border-[#EDEDED]">
                <div className="flex items-center gap-2">
                  <FileText className="text-neuro-primary" size={16} />
                  <span className="text-sm font-semibold text-[#212121]">
                    Medical Report Preview
                  </span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reportPreviewContent.sampleSections.map((section, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-[#EDEDED] last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#212121]">{section}</h4>
                        {section === "References" && (
                          <span className="text-xs text-neuro-primary bg-[#FEF7F3] px-2 py-1 rounded-[6px]">
                            Auto-cited
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8D8D8D] italic">
                        {section === "References"
                          ? "1. Smith, J. et al. (2024). Medical Imaging Analysis..."
                          : "[Editable content section]"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-[#EDEDED] flex items-center justify-between">
                  <span className="text-xs text-[#8D8D8D]">Confidence Score: 87%</span>
                  <div className="flex gap-2">
                    <button className="text-xs text-neuro-primary hover:underline flex items-center gap-1">
                      <Edit size={12} />
                      Edit
                    </button>
                    <button className="text-xs text-neuro-primary hover:underline flex items-center gap-1">
                      <Download size={12} />
                      Export PDF
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

