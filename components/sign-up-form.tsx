"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { EyeIcon, EyeOffIcon } from "@/components/icons/eye-icon";
import { joinName } from "@/lib/auth/user-display";
import { friendlyOAuthError } from "@/lib/auth/oauth-error";
import { NeuroMedicaMark } from "@/components/neuromedica-logo";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!agreeToTerms) {
      setError("Please agree to the Terms of use and Privacy Policy");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected/doctors`,
          data: {
            first_name: firstName,
            last_name: lastName,
            // Persist a combined display name so the UI shows the doctor's
            // chosen name instead of defaulting to their email address.
            full_name: joinName(firstName, lastName),
          },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/protected/doctors`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(friendlyOAuthError(error, "Google"));
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-[435px] min-h-[620px] rounded-[20px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-card))] px-[36px] py-[46px] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none flex flex-col",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-[32px] items-center w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 items-center text-center">
          <NeuroMedicaMark size={48} className="mb-1" />
          <h1 className="text-2xl font-semibold text-[#212121] dark:text-neutral-100 leading-tight tracking-[0.24px]">
            Welcome to NeuroMedica
          </h1>
          <p className="text-sm font-normal text-[#6B6C6E] dark:text-neutral-400 leading-[1.15]">
            Enter your credentials to access your account.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSignUp}
          className="flex flex-col gap-[22px] items-center w-[300px]"
        >
          <div className="flex flex-col gap-4 items-start w-full">
            <div className="flex flex-col gap-6 items-start w-full">
              {/* Google Sign Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-elevated))] flex items-center justify-center gap-2 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <GoogleIcon className="w-4 h-4" />
                <span className="text-sm font-normal text-[#212121] dark:text-neutral-200">
                  Sign up with Google
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full">
                <span className="h-px flex-1 bg-[rgba(107,108,110,0.15)] dark:bg-white/10" />
                <span className="text-xs font-medium text-[#212121] dark:text-neutral-400 lowercase">
                  or
                </span>
                <span className="h-px flex-1 bg-[rgba(107,108,110,0.15)] dark:bg-white/10" />
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-4 items-start w-full">
                <div className="flex flex-col gap-2 items-start w-full">
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-elevated))] px-3 text-[13px] font-normal text-[#212121] dark:text-neutral-100 placeholder:text-[#8D8D8D] dark:placeholder:text-neutral-500 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
                  />
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-elevated))] px-3 text-[13px] font-normal text-[#212121] dark:text-neutral-100 placeholder:text-[#8D8D8D] dark:placeholder:text-neutral-500 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-elevated))] px-3 text-[13px] font-normal text-[#212121] dark:text-neutral-100 placeholder:text-[#8D8D8D] dark:placeholder:text-neutral-500 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
                  />
                  <div className="relative w-full">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-elevated))] px-3 pr-10 text-[13px] font-normal text-[#212121] dark:text-neutral-100 placeholder:text-[#8D8D8D] dark:placeholder:text-neutral-500 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] dark:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8D8D] dark:text-neutral-400 hover:text-[#212121] dark:hover:text-neutral-200 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2 w-full">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) =>
                      setAgreeToTerms(checked === true)
                    }
                    className="rounded-[6px] border border-[#EDEDED] dark:border-white/20 data-[state=checked]:bg-[#F76B15] data-[state=checked]:border-[#F76B15] w-3 h-3 mt-0.5"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs font-normal text-[#212121] dark:text-neutral-300 leading-[1.6] cursor-pointer flex-1"
                  >
                    By creating an account, I agree to our Terms of use and
                    Privacy Policy
                  </label>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 w-full">{error}</p>
              )}

              {/* Continue Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="h-[40px] w-full rounded-[16px] text-sm font-normal text-white shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)] hover:brightness-110 disabled:opacity-50 transition-all relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)",
                }}
              >
                <span className="relative z-10">
                  {isLoading ? "Creating account..." : "Continue"}
                </span>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_8.4px_4.2px_rgba(255,255,255,0.4),inset_0px_4px_3px_0px_rgba(255,255,255,0.28)]" />
              </button>
            </div>

            {/* Footer */}
            <p className="text-[13px] font-normal text-[#BBBBBB] dark:text-neutral-500 text-center leading-[1.15] w-full">
              Crafted with ❤️ by NeuroMedica
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
