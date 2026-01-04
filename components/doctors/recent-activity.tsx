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
      <Card className="rounded-[20px] border border-[#EDEDED] bg-white overflow-hidden shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)]">
        <CardHeader className="p-6 border-b border-[#EDEDED]">
          <h3 className="text-[18px] font-medium text-[#212121] mb-2">
            {recentActivityContent.title}
          </h3>
          <p className="text-sm text-[#6B6C6E]">
            {recentActivityContent.subtitle}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#EDEDED] bg-[#FAFAFA]">
                <tr>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] whitespace-nowrap">
                    Type
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] whitespace-nowrap">
                    Patient
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] whitespace-nowrap">
                    Date
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] whitespace-nowrap">
                    Report ID
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-[#212121] whitespace-nowrap">
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
                    className="border-b border-[#EDEDED] hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 text-[#212121]">{activity.type}</td>
                    <td className="p-4 text-[#212121]">{activity.patient}</td>
                    <td className="p-4 text-[#6B6C6E]">{activity.date}</td>
                    <td className="p-4 text-[#212121] font-medium">
                      {activity.reportId}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-1.5"
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



