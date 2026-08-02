"use client";

import Image from "next/image";
import Link from "next/link";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateOrganization } from "@/services/organization/useOrganization";
import common from "../auth-common.module.css";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const router = useRouter();
  const createOrganization = useCreateOrganization();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword((currentValue) => !currentValue);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitAttempted(true);
    if (
      !organizationName.trim() ||
      !address.trim() ||
      !organizationType.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError("All fields are required.");
      return;
    }
    createOrganization.mutate(
      {
        name: organizationName,
        address,
        organization_type: organizationType,
        adminEmail: email,
        adminPassword: password,
      },
      {
        onSuccess: () => {
          setSuccess("Organization created successfully! Redirecting to sign in...");
          setTimeout(() => router.push("/sign-in"), 1500);
        },
        onError: (err: any) => {
          setError(err?.message || "Signup failed. Please try again.");
        },
      }
    );
  };

  return (
    <section className={`${common.pageShell} ${common.pageShellFull}`}>
      <div className={`${common.authCard} ${common.authCardFull}`}>
        <div className={`${common.illustrationPanel} ${common.illustrationPanelFull}`}>
          <Image
            src="/images/SignUp.webp"
            alt="Workspace sign up illustration"
            fill
            sizes="(max-width: 1023px) 0px, 59vw"
            className={common.illustrationImage}
            priority
            quality={75}
          />
        </div>

        <div className={`${common.formPanel} ${common.formPanelFull}`}>
          <div className={`${common.formWrap} ${common.formWrapFull}`}>
            <h1 className={`${common.title} ${common.titleFull}`}>Create your workspace</h1>
            <p className={`${common.subtitle} ${common.subtitleFull}`}>Begin your journey toward focused remote work.</p>

            <form className={`${common.form} ${common.formFull} ${common.tightForm}`} onSubmit={handleSubmit}>
              {success && (
                <div className={common.helperText} style={{ color: "green" }}>{success}</div>
              )}
              {error && (
                <div className={common.helperText} style={{ color: "red" }}>{error}</div>
              )}

              <div className={common.fieldBlock}>
                <label htmlFor="organizationName" className={`${common.label} ${common.labelFull}`}>
                  Organization Name<span className={common.required}>*</span>
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  placeholder="Acme Corporation"
                  className={`${common.input} ${common.inputFull} ${submitAttempted && !organizationName.trim() ? `${common.inputError} ${common.inputErrorFull}` : ""}`}
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                />
              </div>

              <div className={common.fieldBlock}>
                <label htmlFor="address" className={`${common.label} ${common.labelFull}`}>
                  Address<span className={common.required}>*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Karachi, Pakistan"
                  className={`${common.input} ${common.inputFull} ${submitAttempted && !address.trim() ? `${common.inputError} ${common.inputErrorFull}` : ""}`}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div className={common.fieldBlock}>
                <label htmlFor="organizationType" className={`${common.label} ${common.labelFull}`}>
                  Organization Type<span className={common.required}>*</span>
                </label>
                <input
                  id="organizationType"
                  name="organizationType"
                  type="text"
                  placeholder="IT Services"
                  className={`${common.input} ${common.inputFull} ${submitAttempted && !organizationType.trim() ? `${common.inputError} ${common.inputErrorFull}` : ""}`}
                  value={organizationType}
                  onChange={e => setOrganizationType(e.target.value)}
                />
              </div>

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

              <button type="submit" className={`${common.submitButton} ${common.submitButtonFull}`}>
                Sign Up
              </button>
            </form>

            <p className={`${common.helperText} ${common.helperTextCompact} ${common.helperTextFull}`}>
              Already have an account?{" "}
              <Link href="/sign-in" className={`${common.helperLink} ${common.helperLinkFull}`}>
                Sign In
              </Link>
            </p>

            <p className={`${common.termsText} ${common.termsTextFull}`}>
              By signing in you are agreeing to our{" "}<br />
              <Link href="#" className={`${common.termsLink} ${common.termsLinkFull}`}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className={`${common.termsLink} ${common.termsLinkFull}`}>
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUp;