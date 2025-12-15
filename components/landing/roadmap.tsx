"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roadmapContent } from "@/lib/landing-content";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const statusIcons = {
  Current: CheckCircle2,
  Planned: Clock,
  Future: Circle,
};

const statusColors = {
  Current: "text-success",
  Planned: "text-warning",
  Future: "text-[#8D8D8D]",
};

export function Roadmap() {
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
            {roadmapContent.title}
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            {roadmapContent.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {roadmapContent.roadmap.map((phase, index) => {
            const StatusIcon = statusIcons[phase.status as keyof typeof statusIcons];
            const statusColor = statusColors[phase.status as keyof typeof statusColors];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] h-full rounded-[20px]">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl font-semibold text-[#212121]">
                        {phase.phase}
                      </CardTitle>
                      <StatusIcon className={statusColor} size={20} />
                    </div>
                    <h3 className="text-lg font-medium text-[#525252]">{phase.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {phase.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-2 text-sm text-[#525252]"
                        >
                          <span className="text-neuro-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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

