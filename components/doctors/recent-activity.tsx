"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recentActivityContent } from "@/lib/doctor-content";
import { Eye } from "lucide-react";

export function RecentActivity() {
  return (
    <section className="mb-6">
      <Card className="rounded-[20px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] overflow-hidden shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none">
        <CardHeader className="p-6 border-b border-[#EDEDED] dark:border-white/10">
          <h3 className="text-[18px] font-medium text-[#212121] dark:text-neutral-100 mb-2">
            {recentActivityContent.title}
          </h3>
          <p className="text-sm text-[#6B6C6E] dark:text-neutral-400">
            {recentActivityContent.subtitle}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#EDEDED] dark:border-white/10 bg-[#FAFAFA] dark:bg-white/5">
                <tr>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] dark:text-neutral-200 whitespace-nowrap">
                    Type
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] dark:text-neutral-200 whitespace-nowrap">
                    Patient
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] dark:text-neutral-200 whitespace-nowrap">
                    Date
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] dark:text-neutral-200 whitespace-nowrap">
                    Report ID
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] dark:text-neutral-200 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivityContent.activities.map((activity, index) => (
                  <motion.tr
                    key={activity.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-[#EDEDED] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-[#212121] dark:text-neutral-200">{activity.type}</td>
                    <td className="p-4 text-[#212121] dark:text-neutral-200">{activity.patient}</td>
                    <td className="p-4 text-[#6B6C6E] dark:text-neutral-400">{activity.date}</td>
                    <td className="p-4 text-[#212121] dark:text-neutral-200 font-medium">
                      {activity.reportId}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border border-[#EDEDED] dark:border-white/10 text-[#212121] dark:text-neutral-200 bg-white dark:bg-[hsl(var(--surface-elevated))] hover:bg-gray-50 dark:hover:bg-white/10 rounded-[10px] flex items-center gap-1.5"
                        asChild
                      >
                        <Link href={`/reports/${activity.reportId}`}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}






