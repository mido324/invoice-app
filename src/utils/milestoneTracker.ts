const STORAGE_KEY = 'invoice_pdf_count';
const LAST_MILESTONE_KEY = 'invoice_last_milestone';

const MILESTONES = [3, 10, 25];

export function getPdfCount(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
}

export function incrementPdfCount(): number {
  const next = getPdfCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export function shouldShowMilestone(): boolean {
  const count = getPdfCount();
  const lastShown = parseInt(localStorage.getItem(LAST_MILESTONE_KEY) ?? '0', 10);
  return MILESTONES.some((m) => count >= m && m > lastShown);
}

export function dismissMilestone(): void {
  const count = getPdfCount();
  const reached = MILESTONES.filter((m) => count >= m);
  if (reached.length > 0) {
    localStorage.setItem(LAST_MILESTONE_KEY, String(Math.max(...reached)));
  }
}

export function currentMilestone(): number {
  const count = getPdfCount();
  const reached = MILESTONES.filter((m) => count >= m);
  return reached.length > 0 ? Math.max(...reached) : 0;
}
