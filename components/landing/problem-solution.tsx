"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { problemSolutionContent } from "@/lib/landing-content";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";

export function ProblemSolution() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            {problemSolutionContent.title}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-[#212121] flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              Current Challenges
            </h3>
            {problemSolutionContent.problems.map((problem, index) => (
              <Card
                key={index}
                className="border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] hover:shadow-lg transition-shadow rounded-[20px]"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#212121]">
                    {problem.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#525252] leading-relaxed">
                    {problem.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-[#212121] flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="text-success" size={20} />
              </div>
              {problemSolutionContent.solution.title}
            </h3>
            <Card className="border-2 border-neuro-primary/20 bg-gradient-to-br from-white to-neuro-primary/5 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] rounded-[20px]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#212121]">
                  Unified Platform
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#525252] leading-relaxed">
                  {problemSolutionContent.solution.description}
                </p>
                <ul className="space-y-3">
                  {problemSolutionContent.solution.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-[#525252]">
                      <div className="w-5 h-5 rounded-full bg-neuro-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="text-neuro-primary" size={12} />
                      </div>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

