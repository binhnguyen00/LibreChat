import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  ThemeContext,
  SecretInput,
  Spinner,
  Button,
  Input,
  isDark,
  floatingLabel,
} from '@librechat/client';
import type { TLoginUser, TStartupConfig } from 'librechat-data-provider';
import type { TAuthContext } from '~/common';
import { useResendVerificationEmail, useGetStartupConfig } from '~/data-provider';
import { validateEmail } from '~/utils';
import { useLocalize } from '~/hooks';

type TLoginFormProps = {
  onSubmit: (data: TLoginUser) => void;
  startupConfig: TStartupConfig;
  error: Pick<TAuthContext, 'error'>['error'];
  setError: Pick<TAuthContext, 'setError'>['setError'];
};

const LoginForm: React.FC<TLoginFormProps> = ({ onSubmit, startupConfig, error, setError }) => {
  const localize = useLocalize();
  const { theme } = useContext(ThemeContext);
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TLoginUser>();
  const [showResendLink, setShowResendLink] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { data: config } = useGetStartupConfig();
  const useUsernameLogin = config?.ldap?.username;
  const validTheme = isDark(theme) ? 'dark' : 'light';
  const requireCaptcha = Boolean(startupConfig.turnstile?.siteKey);
  /** The `webauthn` token lets the browser offer a passkey inline in this field's autofill. */
  const baseAutoComplete = useUsernameLogin ? 'username' : 'email';
  const emailAutoComplete = startupConfig.passkeyLoginEnabled
    ? `${baseAutoComplete} webauthn`
    : baseAutoComplete;

  useEffect(() => {
    if (error && error.includes('422') && !showResendLink) {
      setShowResendLink(true);
    }
  }, [error, showResendLink]);

  const resendLinkMutation = useResendVerificationEmail({
    onMutate: () => {
      setError(undefined);
      setShowResendLink(false);
    },
  });

  if (!startupConfig) {
    return null;
  }

  const renderError = (fieldName: string) => {
    const errorMessage = errors[fieldName]?.message;
    return errorMessage ? (
      <span role="alert" className="text-text-destructive mt-1 text-sm">
        {String(errorMessage)}
      </span>
    ) : null;
  };

  const handleResendEmail = () => {
    const email = getValues('email');
    if (!email) {
      return setShowResendLink(false);
    }
    resendLinkMutation.mutate({ email });
  };

  return (
    <>
      {showResendLink && (
        <div className="border-status-success-border bg-status-success-subtle text-text-secondary mt-2 rounded-md border px-3 py-2 text-sm">
          {localize('com_auth_email_verification_resend_prompt')}
          <button
            type="button"
            className="text-link ms-2 hover:underline"
            onClick={handleResendEmail}
            disabled={resendLinkMutation.isLoading}
          >
            {localize('com_auth_email_resend_link')}
          </button>
        </div>
      )}
      <form
        className="mt-6"
        aria-label="Login form"
        method="POST"
        onSubmit={handleSubmit((data) => onSubmit(data))}
      >
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            {useUsernameLogin
              ? localize('com_auth_username').replace(/ \(.*$/, '')
              : 'Tên đăng nhập'}
          </label>
          <Input
            colorTransition
            type="text"
            id="email"
            autoComplete={emailAutoComplete}
            aria-label={localize('com_auth_email')}
            {...register('email', {
              required: localize('com_auth_email_required'),
              maxLength: { value: 120, message: localize('com_auth_email_max_length') },
              validate: useUsernameLogin
                ? undefined
                : (value) => validateEmail(value, localize('com_auth_email_pattern')),
            })}
            aria-invalid={!!errors.email}
            variant="default"
            placeholder="Nhập tên đăng nhập"
            className="h-theme-auth-field w-full h-11 rounded-md border !border-gray-300 px-3.5 py-2 text-sm !text-gray-900 placeholder:!text-gray-400 focus:!border-[#0b2342] focus:!ring-1 focus:!ring-[#0b2342] focus:outline-none transition-colors !bg-white shadow-none"
          />
          {renderError('email')}
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {localize('com_auth_password')}
            </label>
            {startupConfig.passwordResetEnabled && (
              <a
                href="/forgot-password"
                className="text-sm font-normal text-[#0061af] hover:text-[#004e8c] hover:underline transition-colors"
              >
                {localize('com_auth_password_forgot')}
              </a>
            )}
          </div>
          <SecretInput
            colorTransition
            id="password"
            autoComplete="current-password"
            aria-label={localize('com_auth_password')}
            {...register('password', {
              required: localize('com_auth_password_required'),
              minLength: {
                value: startupConfig?.minPasswordLength || 8,
                message: localize('com_auth_password_min_length'),
              },
              maxLength: { value: 128, message: localize('com_auth_password_max_length') },
            })}
            aria-invalid={!!errors.password}
            variant="default"
            placeholder="Nhập mật khẩu"
            buttonClassName="text-gray-400 hover:text-gray-600 hover:bg-transparent"
            className="h-theme-auth-field w-full h-11 rounded-md border !border-gray-300 px-3.5 py-2 text-sm !text-gray-900 placeholder:!text-gray-400 focus:!border-[#0b2342] focus:!ring-1 focus:!ring-[#0b2342] focus:outline-none transition-colors !bg-white shadow-none"
          />
          {renderError('password')}
        </div>

        <div className="mb-5 flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#0b2342] focus:ring-[#0b2342] cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="ms-2 block text-sm text-gray-600 select-none cursor-pointer"
          >
            Ghi nhớ đăng nhập trên thiết bị này
          </label>
        </div>

        {requireCaptcha && (
          <div className="my-4 flex justify-center">
            <Turnstile
              siteKey={startupConfig.turnstile!.siteKey}
              options={{
                ...startupConfig.turnstile!.options,
                theme: validTheme,
              }}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>
        )}

        <div className="mt-6">
          <Button
            aria-label={localize('com_auth_continue')}
            data-testid="login-button"
            type="submit"
            disabled={(requireCaptcha && !turnstileToken) || isSubmitting}
            variant="submit"
            shape="soft"
            size="auth"
            className="w-full h-11 !bg-[#0b2342] hover:!bg-[#133563] !text-white !font-medium !text-base !rounded-md flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b2342] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Spinner /> : localize('com_auth_sign_in')}
          </Button>
        </div>

        <p className="mt-6 text-xs text-gray-500 leading-relaxed text-center sm:text-left">
          Chưa có tài khoản hoặc cần cấp lại quyền truy cập? Vui lòng liên hệ quản trị hệ thống của đơn vị.
        </p>
      </form>
    </>
  );
};

export default LoginForm;
