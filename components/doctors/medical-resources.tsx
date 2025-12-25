"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { medicalResourcesContent } from "@/lib/doctor-content";
import {
  BookOpen,
  FileText,
  Database,
  FileCheck,
  LucideIcon,
  ArrowRight,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  FileText,
  Database,
  FileCheck,
};

export function MedicalResources() {
  return (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-[18px] font-medium text-[#212121] mb-2">
          {medicalResourcesContent.title}
        </h2>
        <p className="text-sm text-[#6B6C6E]">
          {medicalResourcesContent.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {medicalResourcesContent.resources.map((resource, index) => {
          const Icon = iconMap[resource.icon] || FileText;

          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={resource.href}>
                <Card className="rounded-[20px] border border-[#EDEDED] bg-white p-4 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] hover:shadow-xl hover:border-neuro-primary/20 transition-all duration-300 cursor-pointer h-full group">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-neuro-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-[#212121] mb-1.5">
                      {resource.name}
                    </h3>
                    <p className="text-xs text-[#525252] leading-relaxed flex-1 mb-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-neuro-primary font-medium group-hover:gap-2 transition-all">
                      <span>Access</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
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

