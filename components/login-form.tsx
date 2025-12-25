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

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/protected/doctors");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-[435px] min-h-[507px] rounded-[20px] border border-[#EDEDED] bg-white px-[36px] py-[46px] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] flex flex-col",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-[32px] items-center w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 items-center text-center">
          <h1 className="text-2xl font-semibold text-[#212121] leading-tight tracking-[0.24px]">
            Welcome to Neuro Medica
          </h1>
          <p className="text-sm font-normal text-[#6B6C6E] leading-[1.15]">
            Enter your credentials to access your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-[22px] items-center w-[300px]">
          <div className="flex flex-col gap-6 items-start w-full">
            <div className="flex flex-col gap-6 items-start w-full">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] bg-white flex items-center justify-center gap-2 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <GoogleIcon className="w-4 h-4" />
                <span className="text-sm font-normal text-[#212121]">
                  Sign in with Google
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 w-full">
                <span className="h-px flex-1 bg-[rgba(107,108,110,0.15)]" />
                <span className="text-xs font-medium text-[#212121] lowercase">
                  or
                </span>
                <span className="h-px flex-1 bg-[rgba(107,108,110,0.15)]" />
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-4 items-start w-full">
                <div className="flex flex-col gap-2 items-start w-full">
                  <Input
                    type="text"
                    placeholder="Enter your user name"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] bg-white px-3 text-[13px] font-normal text-[#212121] placeholder:text-[#8D8D8D] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
                  />
                  <div className="relative w-full">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-[40px] w-full rounded-[10px] border border-[#EDEDED] bg-white px-3 pr-10 text-[13px] font-normal text-[#212121] placeholder:text-[#8D8D8D] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8D8D] hover:text-[#212121] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                      className="rounded-[6px] border border-[#EDEDED] data-[state=checked]:bg-[#F76B15] data-[state=checked]:border-[#F76B15] w-3 h-3"
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-xs font-normal text-[#212121] leading-[1.15] cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-[#F76B15] hover:text-[#e55a0a] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 w-full">{error}</p>
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
                  {isLoading ? "Signing in..." : "Continue"}
                </span>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_8.4px_4.2px_rgba(255,255,255,0.4),inset_0px_4px_3px_0px_rgba(255,255,255,0.28)]" />
              </button>
            </div>

            {/* Footer */}
            <p className="text-[13px] font-normal text-[#BBBBBB] text-center leading-[1.15] w-full">
              Crafted with ❤️ by Neuro Medica
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
