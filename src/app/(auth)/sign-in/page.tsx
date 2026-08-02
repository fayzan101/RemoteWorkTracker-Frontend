"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useOrganizationLogin } from "@/services/organization/useOrganization";
import common from "../auth-common.module.css";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const router = useRouter();
  const organizationLogin = useOrganizationLogin();
  const togglePasswordVisibility = () => {
    setShowPassword((currentValue) => !currentValue);
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitAttempted(true);
    if (!email.trim() || !password.trim()) {
      const validationError = "All fields are required.";
      setError(validationError);
      toast.error(validationError);
      return;
    }
    organizationLogin.mutate(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          toast.success("Sign in successful!");
          router.push("/dashboard");
        },
        onError: (err: any) => {
          // Error toast is already shown by apiClient
          const errorMessage = err?.message || "Login failed. Please try again.";
          setError(errorMessage);
        },
      }
    );
  };

  return (
    <section className={`${common.pageShell} ${common.pageShellFull}`}>
      <div className={`${common.authCard} ${common.authCardFull}`}>
        <div className={`${common.illustrationPanel} ${common.illustrationPanelFull}`}>
          <Image
            src="/images/SignIn.webp"
            alt="Workspace sign in illustration"
            fill
            sizes="(max-width: 1023px) 0px, 59vw"
            className={common.illustrationImage}
            priority
            quality={75}
          />
        </div>

        <div className={`${common.formPanel} ${common.formPanelFull}`}>
          <div className={`${common.formWrap} ${common.formWrapFull}`}>
            <h1 className={`${common.title} ${common.titleFull}`}>Login into your workspace</h1>
            <p className={`${common.subtitle} ${common.subtitleFull}`}>
              Welcome Back! Enter credentials to continue.
            </p>

            <form className={`${common.form} ${common.formFull}`} onSubmit={handleSubmit}>
              {error && (
                <div className={common.helperText} style={{ color: "red" }}>{error}</div>
              )}
              <div className={common.fieldBlock}>
                <label htmlFor="email" className={`${common.label} ${common.labelFull}`}>
                  Email<span className={common.required}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="organization123@gmail.com"
                  className={`${common.input} ${common.inputFull} ${submitAttempted && !email.trim() ? `${common.inputError} ${common.inputErrorFull}` : ""}`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className={common.fieldBlock}>
                <label htmlFor="password" className={`${common.label} ${common.labelFull}`}>
                  Password<span className={common.required}>*</span>
                </label>
                <div className={common.passwordWrap}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`${common.input} ${common.inputFull} ${submitAttempted && !password.trim() ? `${common.inputError} ${common.inputErrorFull}` : ""}`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className={common.iconButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={togglePasswordVisibility}
                  >
                    <Image
                      src="/icons/password.svg"
                      alt="Toggle password visibility"
                      width={20}
                      height={20}
                      className={common.iconImage}
                    />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`${common.submitButton} ${common.submitButtonFull}`}
                disabled={organizationLogin.isPending}
              >
                {organizationLogin.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className={`${common.helperText} ${common.helperTextFull}`}>
              Forgot Password?{" "}
              <Link href="/forget-password" className={`${common.helperLink} ${common.helperLinkFull}`}>
                Click here
              </Link>
            </p>
            <p className={`${common.helperText} ${common.helperTextFull}`}>
              Don't have an account?{" "}
              <Link href="/sign-up" className={`${common.helperLink} ${common.helperLinkFull}`}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignIn;