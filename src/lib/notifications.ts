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

/**
 * Dedicated SweetAlert2 report dialog for timeout fallback intervention.
 * Displays completed round/day, reason, executed actions, net budget impact, and remaining treasury.
 * Features a single "Got It — Continue" action and blocks outside clicks.
 */
export async function showFallbackInterventionReport(
  report: {
    completedBucket: number;
    completedDay: number;
    roundName: string;
    reason: string;
    planOrActions?: string;
    executedActionTitles: string[];
    netBudgetImpact: number;
    treasuryRemaining: number;
    timestamp?: string;
  },
  onConfirmAcknowledge?: () => Promise<{ success: boolean; data?: any; error?: string }>
): Promise<SweetAlertResult> {
  if (typeof window === 'undefined') return { isConfirmed: true, isDenied: false, isDismissed: false };

  const executedListHtml = report.executedActionTitles && report.executedActionTitles.length > 0
    ? `<div class="mb-3 text-left">
        <div class="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Actions Executed by Contingency:</div>
        <ul class="space-y-1 font-mono text-xs text-slate-200 bg-slate-950/70 rounded-lg p-2.5 border border-slate-800">
          ${report.executedActionTitles.map(t => `<li class="flex items-start gap-1.5"><span class="text-amber-400">•</span><span>${t}</span></li>`).join('')}
        </ul>
      </div>`
    : (report.planOrActions ? `<div class="mb-3 text-left text-xs font-mono text-slate-300"><strong>Directives:</strong> ${report.planOrActions}</div>` : '');

  const netImpactStr = report.netBudgetImpact <= 0
    ? `-LKR ${Math.abs(Math.round(report.netBudgetImpact))}M`
    : `+LKR ${Math.round(report.netBudgetImpact)}M`;

  const treasuryStr = report.treasuryRemaining < 0
    ? `-LKR ${Math.abs(Math.round(report.treasuryRemaining))}M (Overdraft Drawn)`
    : `LKR ${Math.round(report.treasuryRemaining)}M`;

  const html = `
    <div class="space-y-3 text-slate-300 text-sm leading-relaxed">
      <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-left font-mono text-xs">
        <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-amber-300 font-bold mb-1 gap-1">
          <span>COMPLETED: Day ${report.completedDay}</span>
          <span class="text-slate-400 text-[11px] font-normal">${report.roundName}</span>
        </div>
        <div class="text-slate-300 text-[11px] leading-relaxed mt-1">
          <strong class="text-amber-400">Intervention Reason:</strong> ${report.reason}
        </div>
      </div>

      ${executedListHtml}

      <div class="grid grid-cols-2 gap-2 font-mono text-xs bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-left">
        <div>
          <span class="text-slate-400 text-[10px] uppercase block">Net Budget Impact</span>
          <strong class="${report.netBudgetImpact <= 0 ? 'text-amber-400' : 'text-emerald-400'} font-bold">${netImpactStr}</strong>
        </div>
        <div>
          <span class="text-slate-400 text-[10px] uppercase block">Remaining Treasury</span>
          <strong class="${report.treasuryRemaining < 0 ? 'text-red-400' : 'text-white'} font-bold">${treasuryStr}</strong>
        </div>
      </div>

      <div class="text-[11px] font-mono text-cyan-400/90 text-left pt-1">
        • Official decision timer for the next round is paused until you continue.
      </div>
    </div>
  `;

  const config: SweetAlertOptions = {
    ...getBaseSwalConfig(),
    icon: 'warning',
    iconColor: '#f59e0b',
    title: `Contingency Protocol Activated — Day ${report.completedDay}`,
    html,
    confirmButtonText: 'Got It — Continue',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: false,
    showLoaderOnConfirm: Boolean(onConfirmAcknowledge),
    preConfirm: onConfirmAcknowledge
      ? async () => {
          try {
            const res = await onConfirmAcknowledge();
            if (!res || !res.success) {
              Swal.showValidationMessage(res?.error || 'Server acknowledgment failed. Please retry.');
              return false;
            }
            return res.data || res;
          } catch (err: any) {
            Swal.showValidationMessage(err?.message || 'Network error acknowledging report. Please retry.');
            return false;
          }
        }
      : undefined
  };

  return Swal.fire(config);
}

/**
 * Close any currently active modal/dialog (e.g. when teammate advances the round)
 */
export function closeNotificationModals(): void {
  if (typeof window !== 'undefined') {
    Swal.close();
  }
}

const notifications = {
  error: notifyError,
  warning: notifyWarning,
  success: notifySuccess,
  info: notifyInfo,
  confirm: notifyConfirm,
  showFallbackInterventionReport,
  closeModals: closeNotificationModals,
  toastSuccess,
  toastInfo,
  toastWarning,
  toastError,
};

export default notifications;
