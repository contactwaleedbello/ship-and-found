'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { NIGERIAN_PHONE_REGEX, UX_STRINGS } from '@/lib/constants';

type AuthMode = 'signup' | 'login' | 'reset';

function AuthContent(): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode derived from URL query parameter ?mode=signup|login|reset
  const modeParam = searchParams.get('mode');
  const [activeMode, setActiveMode] = useState<AuthMode>('signup');

  // Registration Fields (Information Design - Step 2)
  const [fullName, setFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupNin, setSignupNin] = useState(''); // Step 4: Text input restricted to digits
  const [signupPassword, setSignupPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password Reset Fields
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);

  // Field Touched States (Category 1: on-blur validation)
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [signupPhoneTouched, setSignupPhoneTouched] = useState(false);
  const [signupEmailTouched, setSignupEmailTouched] = useState(false);
  const [signupNinTouched, setSignupNinTouched] = useState(false);
  const [signupPasswordTouched, setSignupPasswordTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  // Field Error States
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [signupPhoneError, setSignupPhoneError] = useState<string | null>(null);
  const [signupEmailError, setSignupEmailError] = useState<string | null>(null);
  const [signupNinError, setSignupNinError] = useState<string | null>(null);
  const [signupPasswordError, setSignupPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [buttonExplanation, setButtonExplanation] = useState<string | null>(null);

  // Login Errors (Enforced on SUBMIT per Category 3)
  const [loginError, setLoginError] = useState<string | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Sync mode with URL query parameter without full page reload
  useEffect(() => {
    if (modeParam === 'login' || modeParam === 'reset' || modeParam === 'signup') {
      setActiveMode(modeParam);
    } else {
      setActiveMode('signup');
    }
  }, [modeParam]);

  function switchMode(newMode: AuthMode): void {
    setActiveMode(newMode);
    setButtonExplanation(null);
    setServerSuccess(null);
    setLoginError(null);
    // Instant URL update via window.history to prevent page reload and server roundtrip
    window.history.pushState(null, '', `/auth?mode=${newMode}`);
  }

  // --- VALIDATION RULES (Derived for DG Tech Store - Step 3) ---

  // Category 1 & 2: Full Legal Name (Min 2 characters, at least 2 words separated by space)
  function validateFullName(value: string, onBlur = false): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      if (onBlur) setFullNameError('Full legal name is required for Flexi-Pay identity verification.');
      return false;
    }
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2 || trimmed.length < 3) {
      setFullNameError('Provide at least two words (First and Last name) matching your official identification.');
      return false;
    }
    setFullNameError(null);
    return true;
  }

  // Category 2 & 3: Nigerian Phone (+234 or 070/080/081/090/091)
  function validateSignupPhone(value: string, onBlur = false): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      if (onBlur) setSignupPhoneError('Primary phone number is required to receive OTP security verification.');
      return false;
    }
    if (!NIGERIAN_PHONE_REGEX.test(trimmed)) {
      setSignupPhoneError(UX_STRINGS.PHONE_INVALID);
      return false;
    }
    setSignupPhoneError(null);
    return true;
  }

  // Category 3: Email Format - REAL-TIME on Registration
  function validateSignupEmail(value: string, onBlur = false): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      if (onBlur) setSignupEmailError('Email address is required for agreement receipts and payment schedules.');
      return false;
    }
    // Valid format: local-part@domain.tld
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setSignupEmailError('Enter a valid email address format (e.g., name@domain.com).');
      return false;
    }
    setSignupEmailError(null);
    return true;
  }

  // Step 4 & 5: NIN - Text input restricted to digits, sensitive format concealed
  function handleNinInput(raw: string): void {
    // Only allow digits, strip all non-numeric characters immediately
    const digitsOnly = raw.replace(/\D/g, '');
    setSignupNin(digitsOnly);
    validateNin(digitsOnly);
  }

  function validateNin(value: string, onBlur = false): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      if (onBlur) setSignupNinError('National Identity Number is required for identity binding.');
      return false;
    }
    if (trimmed.length !== 11) {
      // Step 5: Informative without revealing attacker clues
      setSignupNinError('Enter your valid National Identity Number.');
      return false;
    }
    setSignupNinError(null);
    return true;
  }

  // Step 7: Password Rules (Length beats complexity; min 8 characters)
  function validateSignupPassword(value: string, onBlur = false): boolean {
    if (value.length === 0) {
      if (onBlur) setSignupPasswordError('Password is required.');
      return false;
    }
    if (value.length < 8) {
      setSignupPasswordError('Password must be at least 8 characters in length.');
      return false;
    }
    setSignupPasswordError(null);
    return true;
  }

  // Step 2 & Step 7: Terms Acceptance validation
  function validateTerms(accepted: boolean): boolean {
    if (!accepted) {
      setTermsError('You must accept the Flexi-Pay Terms & Conditions to create an account.');
      return false;
    }
    setTermsError(null);
    return true;
  }

  // Is registration form completely valid?
  const isSignupFormValid =
    validateFullName(fullName) &&
    validateSignupPhone(signupPhone) &&
    validateSignupEmail(signupEmail) &&
    validateNin(signupNin) &&
    validateSignupPassword(signupPassword) &&
    termsAccepted;

  // Handle click on submit button when disabled
  function handleDisabledButtonClick(): void {
    if (!termsAccepted) {
      setButtonExplanation('Please accept the Flexi-Pay Terms & Conditions above before submitting.');
      setTermsError('Acceptance is required to activate the submit button.');
      setTermsTouched(true);
    } else if (!isSignupFormValid) {
      setButtonExplanation('Please complete all required fields correctly before submitting.');
    }
  }

  // --- SUBMISSIONS ---

  async function handleSignupSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!isSignupFormValid) {
      handleDisabledButtonClick();
      return;
    }

    setIsSubmitting(true);
    setButtonExplanation(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: signupPhone.trim(),
          email: signupEmail.trim(),
          nin: signupNin.trim(),
          password: signupPassword,
          termsAccepted,
          whatsappConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setButtonExplanation(data.error?.message || 'Registration failed on server.');
      } else {
        setServerSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => switchMode('login'), 1200);
      }
    } catch {
      setButtonExplanation('Network connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 3 Category 3: Login format validation enforced ON SUBMIT, not real-time
  async function handleLoginSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoginError(null);

    // Enforce format validation on submit
    const trimmedId = loginIdentifier.trim();
    if (!trimmedId) {
      setLoginError('Enter your registered phone number or email.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: trimmedId,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Step 5: Do not leak which half was wrong
        setLoginError('Incorrect phone number or password details.');
      } else {
        router.push(data.redirectUrl || '/');
      }
    } catch {
      setLoginError('Network error. Check connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] py-10 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl shadow-lg overflow-hidden">
        
        {/* SPA Pill / Tab Switcher (Query Param ?mode=...) */}
        <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]" role="tablist" aria-label="Authentication Options">
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'signup'}
            aria-controls="panel-signup"
            id="tab-signup"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
              activeMode === 'signup'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-fg-brand)] border-b-2 border-[var(--color-border-brand)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'login'}
            aria-controls="panel-login"
            id="tab-login"
            onClick={() => switchMode('login')}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
              activeMode === 'login'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-fg-brand)] border-b-2 border-[var(--color-border-brand)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'reset'}
            aria-controls="panel-reset"
            id="tab-reset"
            onClick={() => switchMode('reset')}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
              activeMode === 'reset'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-fg-brand)] border-b-2 border-[var(--color-border-brand)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]'
            }`}
          >
            Reset Access
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-fg-default)] font-heading">
              {activeMode === 'signup' && 'DG Tech Store Customer Registration'}
              {activeMode === 'login' && 'Sign in to DG Tech Store'}
              {activeMode === 'reset' && 'Reset Security Credentials'}
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              {activeMode === 'signup' && 'Register your identity for Banex Plaza (Shop ATF 03) part-payment plans.'}
              {activeMode === 'login' && 'Access your active Flexi-Pay applications, balances, and contracts.'}
              {activeMode === 'reset' && 'Verify your registered phone to initiate credential recovery.'}
            </p>
          </div>

          {/* Success banner */}
          {serverSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--color-bg-success)] text-[var(--color-fg-success)] flex items-center gap-3" role="status">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{serverSuccess}</p>
            </div>
          )}

          {/* =========================================================================
              PANEL 1: SIGNUP FORM (Step 2, 3, 4, 5, 6, 7)
             ========================================================================= */}
          {activeMode === 'signup' && (
            <form
              id="panel-signup"
              role="tabpanel"
              aria-labelledby="tab-signup"
              onSubmit={handleSignupSubmit}
              noValidate
              className="space-y-5"
            >
              {/* Field 1: Full Legal Name */}
              <div>
                <label htmlFor="reg-fullname" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                  Full Legal Name <span className="text-[var(--color-fg-error)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  aria-invalid={fullNameTouched && Boolean(fullNameError)}
                  aria-describedby={fullNameError ? 'err-fullname' : 'hint-fullname'}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameTouched) validateFullName(e.target.value);
                  }}
                  onBlur={() => {
                    setFullNameTouched(true);
                    validateFullName(fullName, true);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                    fullNameTouched && fullNameError
                      ? 'border-[var(--color-border-error)] focus:ring-[var(--color-border-error)] bg-[var(--color-bg-error)]/10'
                      : 'border-[var(--color-border-subtle)] focus:ring-[var(--color-border-brand)]'
                  }`}
                  placeholder="e.g. Ahmed Abdullahi"
                />
                <p id="hint-fullname" className="text-xs text-[var(--color-fg-muted)] mt-1">
                  Must match the name on your National Identity Management (NIMC) records.
                </p>
                {fullNameTouched && fullNameError && (
                  <div id="err-fullname" role="alert" className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-fg-error)]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-error)]" aria-hidden="true" />
                    <span>{fullNameError}</span>
                  </div>
                )}
              </div>

              {/* Field 2: Nigerian Phone Number */}
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                  Primary Mobile Number <span className="text-[var(--color-fg-error)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  aria-required="true"
                  aria-invalid={signupPhoneTouched && Boolean(signupPhoneError)}
                  aria-describedby={signupPhoneError ? 'err-phone' : 'hint-phone'}
                  value={signupPhone}
                  onChange={(e) => {
                    setSignupPhone(e.target.value);
                    if (signupPhoneTouched) validateSignupPhone(e.target.value);
                  }}
                  onBlur={() => {
                    setSignupPhoneTouched(true);
                    validateSignupPhone(signupPhone, true);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                    signupPhoneTouched && signupPhoneError
                      ? 'border-[var(--color-border-error)] focus:ring-[var(--color-border-error)] bg-[var(--color-bg-error)]/10'
                      : 'border-[var(--color-border-subtle)] focus:ring-[var(--color-border-brand)]'
                  }`}
                  placeholder="e.g. 08031234567 or +2348031234567"
                />
                <p id="hint-phone" className="text-xs text-[var(--color-fg-muted)] mt-1">
                  Used for SMS OTP verification and WhatsApp payment reminders.
                </p>
                {signupPhoneTouched && signupPhoneError && (
                  <div id="err-phone" role="alert" className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-fg-error)]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-error)]" aria-hidden="true" />
                    <span>{signupPhoneError}</span>
                  </div>
                )}
              </div>

              {/* Field 3: Email Address (Category 3: Real-time validation on signup) */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                  Email Address <span className="text-[var(--color-fg-error)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={signupEmailTouched && Boolean(signupEmailError)}
                  aria-describedby={signupEmailError ? 'err-email' : 'hint-email'}
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupEmail(e.target.value);
                    // Real-time validation active as user types
                    validateSignupEmail(e.target.value);
                  }}
                  onBlur={() => {
                    setSignupEmailTouched(true);
                    validateSignupEmail(signupEmail, true);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                    signupEmailTouched && signupEmailError
                      ? 'border-[var(--color-border-error)] focus:ring-[var(--color-border-error)] bg-[var(--color-bg-error)]/10'
                      : 'border-[var(--color-border-subtle)] focus:ring-[var(--color-border-brand)]'
                  }`}
                  placeholder="e.g. customer@domain.com"
                />
                <p id="hint-email" className="text-xs text-[var(--color-fg-muted)] mt-1">
                  Real-time checked: Digital agreements and repayment receipts are delivered here.
                </p>
                {signupEmailTouched && signupEmailError && (
                  <div id="err-email" role="alert" className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-fg-error)]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-error)]" aria-hidden="true" />
                    <span>{signupEmailError}</span>
                  </div>
                )}
              </div>

              {/* Field 4: National Identity Number (Step 4 & 5: Text input restricted to digits, no sensitive hint) */}
              <div>
                <label htmlFor="reg-nin" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                  National Identity Number (NIN) <span className="text-[var(--color-fg-error)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-nin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  aria-required="true"
                  aria-invalid={signupNinTouched && Boolean(signupNinError)}
                  aria-describedby={signupNinError ? 'err-nin' : 'hint-nin'}
                  value={signupNin}
                  onChange={(e) => handleNinInput(e.target.value)}
                  onBlur={() => {
                    setSignupNinTouched(true);
                    validateNin(signupNin, true);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                    signupNinTouched && signupNinError
                      ? 'border-[var(--color-border-error)] focus:ring-[var(--color-border-error)] bg-[var(--color-bg-error)]/10'
                      : 'border-[var(--color-border-subtle)] focus:ring-[var(--color-border-brand)]'
                  }`}
                  placeholder="National Identity Number"
                />
                <p id="hint-nin" className="text-xs text-[var(--color-fg-muted)] mt-1">
                  Enforces numeric input without spinner or leading-zero bugs. Encrypted with AES-256-GCM.
                </p>
                {signupNinTouched && signupNinError && (
                  <div id="err-nin" role="alert" className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-fg-error)]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-error)]" aria-hidden="true" />
                    <span>{signupNinError}</span>
                  </div>
                )}
              </div>

              {/* Field 5: Password (Step 7: Length over complexity, hint on typing, visibility toggle) */}
              <div>
                <label htmlFor="reg-pass" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                  Security Password <span className="text-[var(--color-fg-error)]" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-pass"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    aria-invalid={signupPasswordTouched && Boolean(signupPasswordError)}
                    aria-describedby={signupPasswordError ? 'err-pass' : 'hint-pass'}
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (signupPasswordTouched || e.target.value.length > 0) {
                        validateSignupPassword(e.target.value);
                      }
                    }}
                    onBlur={() => {
                      setSignupPasswordTouched(true);
                      validateSignupPassword(signupPassword, true);
                    }}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                      signupPasswordTouched && signupPasswordError
                        ? 'border-[var(--color-border-error)] focus:ring-[var(--color-border-error)] bg-[var(--color-bg-error)]/10'
                        : 'border-[var(--color-border-subtle)] focus:ring-[var(--color-border-brand)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password characters' : 'Show password characters'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupPassword.length > 0 && !signupPasswordError && (
                  <p id="hint-pass" className="text-xs text-[var(--color-fg-success)] mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Password length verified (8+ characters).
                  </p>
                )}
                {signupPasswordTouched && signupPasswordError && (
                  <div id="err-pass" role="alert" className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-fg-error)]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-error)]" aria-hidden="true" />
                    <span>{signupPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Terms and Conditions Acceptance */}
              <div className="pt-2">
                <div className="flex items-start gap-3">
                  <input
                    id="reg-terms"
                    type="checkbox"
                    required
                    aria-required="true"
                    aria-invalid={termsTouched && !termsAccepted}
                    aria-describedby={termsError ? 'err-terms' : undefined}
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      validateTerms(e.target.checked);
                    }}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-border-subtle)] text-[var(--color-fg-brand)] focus:ring-[var(--color-border-brand)]"
                  />
                  <label htmlFor="reg-terms" className="text-xs text-[var(--color-fg-default)] leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[var(--color-fg-brand)] underline hover:no-underline font-medium">
                      DG Tech Store Flexi-Pay Terms &amp; Conditions
                    </Link>{' '}
                    and acknowledge that down payment reservations expire in 24 hours if uncollected.
                  </label>
                </div>
                {termsTouched && termsError && (
                  <div id="err-terms" role="alert" className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--color-fg-error)]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-fg-error)]" aria-hidden="true" />
                    <span>{termsError}</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Notification Consent */}
              <div className="flex items-start gap-3">
                <input
                  id="reg-whatsapp"
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-subtle)] text-[var(--color-fg-brand)] focus:ring-[var(--color-border-brand)]"
                />
                <label htmlFor="reg-whatsapp" className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                  Receive real-time payment schedule updates and Banex store pickup receipts on WhatsApp.
                </label>
              </div>

              {/* Step 7: Submit Button (Disabled state explains itself rather than refusing) */}
              <div className="pt-2">
                <div onClick={!isSignupFormValid ? handleDisabledButtonClick : undefined} className="w-full">
                  <button
                    type="submit"
                    disabled={!isSignupFormValid || isSubmitting}
                    aria-disabled={!isSignupFormValid || isSubmitting}
                    className={`w-full py-3.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isSignupFormValid && !isSubmitting
                        ? 'bg-[var(--color-bg-brand)] text-white hover:opacity-95 shadow-md cursor-pointer'
                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] border border-[var(--color-border-subtle)] cursor-not-allowed opacity-80'
                    }`}
                  >
                    {isSubmitting ? 'Registering Identity...' : 'Complete Customer Registration'}
                  </button>
                </div>

                {/* Programmatic explanation for disabled button */}
                {buttonExplanation && (
                  <div role="status" className="mt-2.5 p-2.5 rounded-lg bg-[var(--color-bg-error)]/10 text-[var(--color-fg-error)] text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{buttonExplanation}</span>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* =========================================================================
              PANEL 2: LOGIN FORM (Submit-time validation per Step 3 Category 3)
             ========================================================================= */}
          {activeMode === 'login' && (
            <form
              id="panel-login"
              role="tabpanel"
              aria-labelledby="tab-login"
              onSubmit={handleLoginSubmit}
              noValidate
              className="space-y-5"
            >
              <div>
                <label htmlFor="login-id" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                  Phone Number or Email Address
                </label>
                <input
                  id="login-id"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)]"
                  placeholder="08031234567 or user@domain.com"
                />
                <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                  Enforced on submit rather than real-time typing to minimize login friction.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-pass" className="block text-sm font-medium text-[var(--color-fg-default)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-[var(--color-fg-brand)] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-pass"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div role="alert" className="p-3 rounded-lg bg-[var(--color-bg-error)]/10 text-[var(--color-fg-error)] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-lg bg-[var(--color-bg-brand)] text-white font-semibold text-sm hover:opacity-95 transition-opacity"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Account'}
              </button>
            </form>
          )}

          {/* =========================================================================
              PANEL 3: PASSWORD RESET FORM
             ========================================================================= */}
          {activeMode === 'reset' && (
            <div id="panel-reset" role="tabpanel" aria-labelledby="tab-reset" className="space-y-5">
              {!resetOtpSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!NIGERIAN_PHONE_REGEX.test(resetPhone.trim())) {
                      setButtonExplanation('Enter a valid registered Nigerian phone number.');
                      return;
                    }
                    setResetOtpSent(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="reset-phone" className="block text-sm font-medium text-[var(--color-fg-default)] mb-1">
                      Registered Phone Number
                    </label>
                    <input
                      id="reset-phone"
                      type="tel"
                      required
                      value={resetPhone}
                      onChange={(e) => setResetPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)]"
                      placeholder="08031234567 or +2348031234567"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-fg-muted)] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-fg-brand)] flex-shrink-0 mt-0.5" />
                    <span>
                      Security Hold: Resetting credentials locks new part-payment device disbursements for 24 hours to prevent SIM-swap fraud.
                    </span>
                  </div>

                  {buttonExplanation && (
                    <div role="alert" className="p-2.5 rounded-lg bg-[var(--color-bg-error)]/10 text-[var(--color-fg-error)] text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{buttonExplanation}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-lg bg-[var(--color-bg-brand)] text-white font-semibold text-sm hover:opacity-95 transition-opacity"
                  >
                    Send Verification Code (SMS)
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-lg bg-[var(--color-bg-success)] text-[var(--color-fg-success)] text-sm space-y-2">
                  <p className="font-semibold">Verification Code Dispatched</p>
                  <p className="text-xs">If an account matches {resetPhone}, an SMS code has been sent.</p>
                  <button
                    type="button"
                    onClick={() => setResetOtpSent(false)}
                    className="text-xs underline font-semibold mt-2 block"
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function AuthPage(): ReactNode {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading authentication...</div>}>
      <AuthContent />
    </Suspense>
  );
}

