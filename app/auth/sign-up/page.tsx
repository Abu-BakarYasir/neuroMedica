import { SignUpForm } from "@/components/sign-up-form";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons/arrow-left-icon";

export default function Page() {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white"
      style={{
        backgroundImage: "url('/assets/gradient.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Back to Landing Page Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-[#212121] hover:text-[#E55A2A] transition-colors z-10"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
      <SignUpForm />
    </div>
  );
}
