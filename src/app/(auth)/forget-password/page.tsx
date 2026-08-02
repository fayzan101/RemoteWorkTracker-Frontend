"use client";
import Link from "next/link";
import React, { useState } from "react";
import common from "../auth-common.module.css";
import { useOrganizationForgotPassword } from "services/organization/useOrganization";
import { useRouter } from "next/navigation";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { mutate, isPending, isSuccess, isError, error } = useOrganizationForgotPassword();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(
      { email },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => {
            router.push("/reset-password");
          }, 1200); // show message briefly, then navigate
        },
      }
    );
  };

  return (
    <section className={`${common.pageShell} ${common.pageShellFull}`}>
      <div className={`${common.authCard} ${common.authCardFull} ${common.authCardCompact}`}>
        <div className={`${common.formPanel} ${common.formPanelFull} ${common.formPanelCompact}`}>
          <div className={`${common.formWrap} ${common.formWrapFull} ${common.formWrapCompact}`}>
            <h1 className={`${common.title} ${common.titleFull}`}>Forget Password</h1>
            <p className={`${common.subtitle} ${common.subtitleFull}`}>
              Enter your admin email. We will send a 6-digit OTP to reset your password.
            </p>

            <form className={`${common.form} ${common.formFull} ${common.tightForm}`} onSubmit={handleSubmit}>
              <div className={common.fieldBlock}>
                <label htmlFor="email" className={`${common.label} ${common.labelFull}`}>
                  Email<span className={common.required}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="organization123@gmail.com"
                  className={`${common.input} ${common.inputFull}`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <button type="submit" className={`${common.submitButton} ${common.submitButtonFull}`} disabled={isPending}>
                {isPending ? "Sending..." : "Send Link"}
              </button>
            </form>

            {submitted && isSuccess && (
              <div className={`${common.helperText} ${common.helperTextFull}`} style={{ color: "green" }}>
                If the email exists, a reset link has been sent.
              </div>
            )}
            {isError && (
              <div className={`${common.helperText} ${common.helperTextFull}`} style={{ color: "red" }}>
                {error instanceof Error ? error.message : "Something went wrong. Please try again."}
              </div>
            )}

            <Link href="/sign-in" className={`${common.backLink} ${common.backLinkFull}`}>
              <span aria-hidden="true">←</span>
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgetPassword;