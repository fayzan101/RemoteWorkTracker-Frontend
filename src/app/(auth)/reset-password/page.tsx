"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import common from "../auth-common.module.css";
import { useOrganizationResetPassword } from "services/organization/useOrganization";
import { useRouter } from "next/navigation";

const OTP_LENGTH = 6;

const ResetPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { mutate, isPending, isSuccess, isError, error } = useOrganizationResetPassword();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError("");

    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setValidationError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    if (!newPassword.trim()) {
      setValidationError("New password is required.");
      return;
    }

    mutate(
      { resetCode: trimmedCode, newPassword },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => {
            router.push("/sign-in");
          }, 1200);
        },
      }
    );
  };

  return (
    <section className={`${common.pageShell} ${common.pageShellFull}`}>
      <div className={`${common.authCard} ${common.authCardFull} ${common.authCardCompact} ${common.authCardReset}`}>
        <div className={`${common.formPanel} ${common.formPanelFull} ${common.formPanelCompact}`}>
          <div className={`${common.formWrap} ${common.formWrapFull} ${common.formWrapCompact}`}>
            <h1 className={`${common.title} ${common.titleFull}`}>Reset Your Password</h1>
            <p className={`${common.subtitle} ${common.subtitleFull}`}>
              Chose a strong, unique password to secure your workspace.
            </p>

            <form className={`${common.form} ${common.formFull} ${common.tightForm}`} onSubmit={handleSubmit}>
              <div className={common.fieldBlock}>
                <label htmlFor="code" className={`${common.label} ${common.labelFull}`}>
                  Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="123456"
                  className={`${common.input} ${common.inputFull}`}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                  required
                  disabled={isPending}
                />
              </div>

              <div className={common.fieldBlock}>
                <label htmlFor="newPassword" className={`${common.label} ${common.labelFull}`}>
                  New Password
                </label>
                <div className={common.passwordWrap}>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className={`${common.input} ${common.inputFull}`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    aria-pressed={showNewPassword}
                    className={common.iconButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowNewPassword((currentValue) => !currentValue)}
                  >
                    <Image
                      src="/icons/password.svg"
                      alt="Toggle new password visibility"
                      width={20}
                      height={20}
                      className={common.iconImage}
                    />
                  </button>
                </div>
              </div>

              <div className={common.fieldBlock}>
                <label htmlFor="confirmPassword" className={`${common.label} ${common.labelFull}`}>
                  Confirm New Password
                </label>
                <div className={common.passwordWrap}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className={`${common.input} ${common.inputFull}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-pressed={showConfirmPassword}
                    className={common.iconButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  >
                    <Image
                      src="/icons/password.svg"
                      alt="Toggle confirm password visibility"
                      width={20}
                      height={20}
                      className={common.iconImage}
                    />
                  </button>
                </div>
              </div>

              {validationError && (
                <div className={`${common.helperText} ${common.helperTextFull}`} style={{ color: "red" }}>
                  {validationError}
                </div>
              )}

              <button type="submit" className={`${common.submitButton} ${common.submitButtonFull}`} disabled={isPending}>
                {isPending ? "Resetting..." : "Reset password"}
              </button>
            </form>
            {submitted && isSuccess && (
              <div className={`${common.helperText} ${common.helperTextFull}`} style={{ color: "green" }}>
                Password reset successful. Redirecting to sign in...
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

export default ResetPassword;
