import { ThemeSelector } from '@librechat/client';
import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { hasPublishedPolicies } from '~/utils/policies';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { BlinkAnimation } from './BlinkAnimation';
import LegalConsent from './LegalConsent';
import { Banner } from '../Banners';
import Footer from './Footer';
import { cn } from '~/utils';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const isRegister = pathname.includes('register');
  const isLogin = !pathname.includes('2fa') && pathname.includes('login');
  const showsSocialLogin = isLogin || isRegister;
  /** Both ways in state it, rather than the layout guessing which of them can
   *  create an account. That guess is not available here: account creation
   *  also happens on a first provider sign-in, on a first LDAP sign-in through
   *  the ordinary form, and is gated server-side by ALLOW_SOCIAL_REGISTRATION,
   *  which the startup payload does not carry. The sentence is about
   *  continuing, which is what both screens do, and it names the same policies
   *  the footer bar linked, so a screen states them once. */
  const hasPolicies = hasPublishedPolicies(startupConfig);
  /** Registration states it under its own submit button, where it is read
   *  before the account is created rather than below however many provider
   *  buttons a deployment configured, and it renders that form only once the
   *  config has loaded without error. The login screen has no submit button of
   *  its own to sit under, so there the layout states it below the providers,
   *  for as long as it knows the policies: a background refetch must not swap
   *  the sentence for the bar and back. */
  const registrationStatesConsent =
    isRegister && hasPolicies && !hasStartupConfigError && !isFetching;
  const statesConsentBelowProviders = isLogin && hasPolicies;
  /** The bar is dropped exactly when the sentence is on the screen, so a
   *  reader never meets both and never meets neither. */
  const statesConsent = registrationStatesConsent || statesConsentBelowProviders;
  const isTwoFactorSetup = pathname === '/login/2fa/setup';
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a
              className="text-accent-primary font-semibold hover:underline"
              href="/forgot-password"
            >
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  if (isLogin) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-white">
        <Banner />
        <div className="flex min-h-screen w-full flex-col lg:flex-row">
          {/* Cột trái: Cổng truy cập nội bộ & Form đăng nhập */}
          <div className="flex w-full flex-col justify-between bg-white p-6 sm:p-10 lg:w-1/2 lg:p-12 xl:p-16">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Cổng truy cập nội bộ</span>
              <div className="lg:hidden">
                <img
                  src="assets/MobiFone_logo.svg"
                  alt={localize('com_ui_logo', { 0: startupConfig?.appTitle ?? 'MobiFone' })}
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>

            <div className="mx-auto my-auto w-full max-w-[420px] py-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {localize('com_auth_sign_in')}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Sử dụng tài khoản được cấp để truy cập hệ thống.
                </p>
              </div>

              <DisplayError />

              {children}

              {showsSocialLogin && (
                <div className="mt-4">
                  <SocialLoginRender startupConfig={startupConfig} showPasskey={isLogin} />
                </div>
              )}
              {statesConsentBelowProviders && <LegalConsent startupConfig={startupConfig} />}
              {!statesConsent && (
                <div className="sr-only">
                  <Footer startupConfig={startupConfig} />
                </div>
              )}
            </div>

            <div className="pt-4 text-xs text-gray-500">
              © 2026 MobiFone Hải Phòng
            </div>
          </div>

          {/* Cột phải: Khai thác CSDL dùng chung MobiFone Hải Phòng */}
          <div className="relative hidden min-h-screen select-none flex-col justify-between bg-[#0b2342] p-12 text-white lg:flex lg:w-1/2 xl:p-20">
            <div>
              <BlinkAnimation active={isFetching}>
                <div className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 shadow-sm">
                  <img
                    src="assets/MobiFone_logo.svg"
                    alt={localize('com_ui_logo', { 0: startupConfig?.appTitle ?? 'MobiFone' })}
                    className="h-6 w-auto object-contain"
                  />
                </div>
              </BlinkAnimation>
            </div>

            <div className="my-auto max-w-xl">
              <div className="mb-6 h-1 w-12 rounded-full bg-[#d6212d]" />
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-[40px]">
                Khai thác CSDL dùng chung MobiFone Hải Phòng
              </h2>
              <p className="mt-5 text-base font-normal leading-relaxed text-slate-300 xl:text-lg">
                Nền tảng dữ liệu tập trung phục vụ báo cáo, phân tích và điều hành của đơn vị.
              </p>
            </div>

            <div>
              <p className="text-xs font-normal text-slate-400 xl:text-sm">
                Chỉ dành cho người dùng được cấp quyền. Mọi truy cập đều được ghi nhận.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-primary relative flex min-h-screen flex-col">
      <Banner />
      <BlinkAnimation active={isFetching}>
        <div className="mt-6 h-10 w-full bg-cover">
          <img
            src="assets/MobiFone_logo.svg"
            className="h-full w-full object-contain"
            alt={localize('com_ui_logo', { 0: startupConfig?.appTitle ?? 'LibreChat' })}
          />
        </div>
      </BlinkAnimation>
      <DisplayError />
      <div className="absolute inset-s-0 bottom-0 md:m-4">
        <ThemeSelector />
      </div>

      <main className="flex grow items-center justify-center">
        <div
          className={cn(
            'bg-surface-primary overflow-hidden px-6 py-4 sm:rounded-lg',
            isTwoFactorSetup ? 'w-11/12 max-w-lg' : 'w-authPageWidth sm:max-w-md',
          )}
        >
          {!hasStartupConfigError && !isFetching && header && (
            <h1 className="text-text-primary mb-4 text-center text-3xl font-semibold select-none">
              {header}
            </h1>
          )}
          {children}
          {showsSocialLogin && (
            <SocialLoginRender startupConfig={startupConfig} showPasskey={isLogin} />
          )}
          {statesConsentBelowProviders && <LegalConsent startupConfig={startupConfig} />}
        </div>
      </main>
      {!statesConsent && <Footer startupConfig={startupConfig} />}
    </div>
  );
}

export default AuthLayout;
