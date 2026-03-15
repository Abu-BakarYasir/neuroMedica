"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { patientManagementContent } from "@/lib/doctor-content";
import { Plus, Users } from "lucide-react";

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  const iconMap = {
    up: "/assets/icons/green.svg",
    down: "/assets/icons/red.svg",
    neutral: "/assets/icons/trend-neutral-blue.svg",
  };

  return (
    <Image
      src={iconMap[trend]}
      alt={`${trend} trend`}
      width={16}
      height={16}
      className="object-contain"
    />
  );
}

export function PatientManagement() {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">
            {patientManagementContent.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2"
            style={{
              boxShadow:
                "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01)",
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="font-normal">Add Patient</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {patientManagementContent.stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div
              className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC]"
              style={{
                boxShadow:
                  "0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01), inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)",
              }}
            >
              {/* Pattern Overlay */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: "url(/assets/icons/Pattern.png)",
                  backgroundRepeat: "repeat",
                  backgroundSize: "auto",
                }}
              ></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[15px] font-medium text-[#212121]">
                    {stat.label}
                  </span>
                  <Image
                    src={stat.icon}
                    alt={stat.label}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[40px] font-bold leading-none text-[#212121]">
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendIcon trend={stat.trend} />
                    <span className="text-[#212121]">{stat.comparison}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}






