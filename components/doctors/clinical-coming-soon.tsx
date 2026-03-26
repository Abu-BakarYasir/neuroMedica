import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

type ClinicalComingSoonProps = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

export function ClinicalComingSoon({
  title,
  description,
  Icon,
}: ClinicalComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[min(70vh,640px)] px-2">
      <div className="w-full max-w-[440px] rounded-[20px] border border-[#EDEDED] bg-white p-8 sm:p-10 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] text-center">
        <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5 flex items-center justify-center mx-auto mb-5">
          <Icon className="h-6 w-6 text-neuro-primary" aria-hidden />
        </div>
        <h1
          className="text-xl sm:text-2xl font-semibold text-[#212121] mb-2"
          style={{ letterSpacing: "0.01em" }}
        >
          {title}
        </h1>
        <p className="text-sm text-[#525252] leading-relaxed mb-6">
          {description}
        </p>
        <p className="text-base font-medium text-neuro-primary mb-8">
          Coming soon
        </p>
        <Link
          href="/protected/doctors"
          className="inline-flex items-center gap-2 text-sm font-normal text-[#525252] hover:text-neuro-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
