"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { clinicalToolsContent } from "@/lib/doctor-content";
import {
  Stethoscope,
  Activity,
  BookOpen,
  FileText,
  Search,
  FileCheck,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  Activity,
  BookOpen,
  FileText,
  Search,
  FileCheck,
};

export function ClinicalTools() {
  return (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-[18px] font-medium text-[#212121] mb-2">
          {clinicalToolsContent.title}
        </h2>
        <p className="text-sm text-[#6B6C6E]">
          {clinicalToolsContent.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinicalToolsContent.tools.map((tool, index) => {
          const Icon = iconMap[tool.icon] || FileText;

          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={tool.href}>
                <Card
                  className="rounded-[20px] border border-[#EDEDED] bg-white p-6 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] hover:shadow-xl hover:border-neuro-primary/20 transition-all duration-300 cursor-pointer h-full"
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    <div
                      className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="h-6 w-6 text-neuro-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#212121] mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-[#525252] leading-relaxed flex-1">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}



