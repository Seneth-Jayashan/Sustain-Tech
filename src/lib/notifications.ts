import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * Unified SweetAlert2 notification client for Sustain-Tech
 * Styled in dark navy (#050b14, #0a1120), cyan (#06b6d4, #2dd4bf), and emerald green (#10b981).
 */

const getBaseSwalConfig = (): SweetAlertOptions => ({
  background: '#0a1120',
  color: '#e2e8f0',
  backdrop: 'rgba(5, 11, 20, 0.85)',
  customClass: {
    popup: 'sustain-swal-popup',
    title: 'sustain-swal-title',
    htmlContainer: 'sustain-swal-html',
    confirmButton: 'sustain-swal-confirm-btn',
    cancelButton: 'sustain-swal-cancel-btn',
    denyButton: 'sustain-swal-deny-btn',
  },
  buttonsStyling: false,
  reverseButtons: true,
  focusConfirm: true,
});

const getToastConfig = (): SweetAlertOptions => ({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  background: '#0a1120',
  color: '#e2e8f0',
  customClass: {
    popup: 'sustain-toast-popup',
    title: 'sustain-toast-title',
  },
});

/**
 * Error dialog for critical failures, constraint breaches, or system errors
 */
export async function notifyError(
  title: string,
  message?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> {
  if (typeof window === 'undefined') return { isConfirmed: false, isDenied: false, isDismissed: true };

  const config: SweetAlertOptions = {
    ...getBaseSwalConfig(),
    icon: 'error',
    iconColor: '#ef4444',
    title,
    html: message ? `<div class="text-slate-300 text-sm leading-relaxed">${message}</div>` : undefined,
    confirmButtonText: 'Acknowledge',
  };
  return Swal.fire(Object.assign(config, options));
}

/**
 * Warning dialog for advisory constraints or impending limits
 */
export async function notifyWarning(
  title: string,
  message?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> {
  if (typeof window === 'undefined') return { isConfirmed: false, isDenied: false, isDismissed: true };

  const config: SweetAlertOptions = {
    ...getBaseSwalConfig(),
    icon: 'warning',
    iconColor: '#f59e0b',
    title,
    html: message ? `<div class="text-slate-300 text-sm leading-relaxed">${message}</div>` : undefined,
    confirmButtonText: 'Understood',
  };
  return Swal.fire(Object.assign(config, options));
}

/**
 * Success dialog for authorized operations or milestone completions
 */
export async function notifySuccess(
  title: string,
  message?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> {
  if (typeof window === 'undefined') return { isConfirmed: false, isDenied: false, isDismissed: true };

  const config: SweetAlertOptions = {
    ...getBaseSwalConfig(),
    icon: 'success',
    iconColor: '#10b981',
    title,
    html: message ? `<div class="text-slate-300 text-sm leading-relaxed">${message}</div>` : undefined,
    confirmButtonText: 'Continue',
  };
  return Swal.fire(Object.assign(config, options));
}

/**
 * Informational dialog for briefings, updates, and rules
 */
export async function notifyInfo(
  title: string,
  message?: string,
  options?: SweetAlertOptions
): Promise<SweetAlertResult> {
  if (typeof window === 'undefined') return { isConfirmed: false, isDenied: false, isDismissed: true };

  const config: SweetAlertOptions = {
    ...getBaseSwalConfig(),
    icon: 'info',
    iconColor: '#06b6d4',
    title,
    html: message ? `<div class="text-slate-300 text-sm leading-relaxed">${message}</div>` : undefined,
    confirmButtonText: 'Got It',
  };
  return Swal.fire(Object.assign(config, options));
}

/**
 * Confirmation dialog for consequential actions. Returns true if user confirmed, false otherwise.
 */
export async function notifyConfirm(
  title: string,
  message?: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    isWarning?: boolean;
  }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const mergedOptions: SweetAlertOptions = {
    ...getBaseSwalConfig(),
    icon: options?.isWarning ? 'warning' : 'question',
    iconColor: options?.isWarning ? '#f59e0b' : '#06b6d4',
    title,
    html: message ? `<div class="text-slate-300 text-sm leading-relaxed">${message}</div>` : undefined,
    showCancelButton: true,
    confirmButtonText: options?.confirmText || 'Confirm',
    cancelButtonText: options?.cancelText || 'Cancel',
  };

  const result = await Swal.fire(mergedOptions);
  return result.isConfirmed;
}

/**
 * Non-blocking toast notifications
 */
export function toastSuccess(title: string, message?: string) {
  if (typeof window === 'undefined') return;
  const mergedOptions: SweetAlertOptions = {
    ...getToastConfig(),
    icon: 'success',
    iconColor: '#10b981',
    title,
    html: message ? `<span class="text-xs text-slate-300">${message}</span>` : undefined,
  };
  Swal.fire(mergedOptions);
}

export function toastInfo(title: string, message?: string) {
  if (typeof window === 'undefined') return;
  const mergedOptions: SweetAlertOptions = {
    ...getToastConfig(),
    icon: 'info',
    iconColor: '#06b6d4',
    title,
    html: message ? `<span class="text-xs text-slate-300">${message}</span>` : undefined,
  };
  Swal.fire(mergedOptions);
}

export function toastWarning(title: string, message?: string) {
  if (typeof window === 'undefined') return;
  const mergedOptions: SweetAlertOptions = {
    ...getToastConfig(),
    icon: 'warning',
    iconColor: '#f59e0b',
    title,
    html: message ? `<span class="text-xs text-slate-300">${message}</span>` : undefined,
  };
  Swal.fire(mergedOptions);
}

export function toastError(title: string, message?: string) {
  if (typeof window === 'undefined') return;
  const mergedOptions: SweetAlertOptions = {
    ...getToastConfig(),
    icon: 'error',
    iconColor: '#ef4444',
    title,
    html: message ? `<span class="text-xs text-slate-300">${message}</span>` : undefined,
  };
  Swal.fire(mergedOptions);
}

const notifications = {
  error: notifyError,
  warning: notifyWarning,
  success: notifySuccess,
  info: notifyInfo,
  confirm: notifyConfirm,
  toastSuccess,
  toastInfo,
  toastWarning,
  toastError,
};

export default notifications;
