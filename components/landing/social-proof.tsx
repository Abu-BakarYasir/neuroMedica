"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { socialProofContent } from "@/lib/landing-content";
import { Quote, Star } from "lucide-react";
import { useState } from "react";

export function SocialProof() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] mb-4">
            What Medical Students Say
          </h2>
          <p className="text-lg text-[#525252] max-w-2xl mx-auto">
            See how Neuro Medica is transforming medical education
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative mb-16">
          <div className="overflow-hidden rounded-[20px]">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Card className="border border-[#EDEDED] bg-white shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] rounded-[20px]">
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <Quote className="text-neuro-primary mb-4" size={32} />
                      <p className="text-lg text-[#525252] leading-relaxed mb-6">
                        "{socialProofContent.testimonials[currentTestimonial].quote}"
                      </p>
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="text-[#DFAD0C] fill-[#DFAD0C]"
                            size={20}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="font-semibold text-[#212121]">
                          {socialProofContent.testimonials[currentTestimonial].name}
                        </p>
                        <p className="text-sm text-[#8D8D8D]">
                          {socialProofContent.testimonials[currentTestimonial].role}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {socialProofContent.testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentTestimonial === index
                    ? "bg-neuro-primary w-8"
                    : "bg-[#EDEDED] hover:bg-[#D0D0D0]"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        {socialProofContent.trustBadges && socialProofContent.trustBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <p className="text-sm text-[#8D8D8D] mb-6">Trusted by leading institutions</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {socialProofContent.trustBadges.map((badge, index) => (
                <div
                  key={index}
                  className="text-2xl font-semibold text-[#525252] hover:opacity-100 transition-opacity"
                >
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}






